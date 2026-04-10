/**
 * @file features/episode/snap/service.js
 * @description 스냅 이미지 생성 비즈니스 로직.
 *   샷의 render_prompt → (자동 앵커 생성) → LoRA + PuLID 참조 → Flux 1 Krea Dev → Oracle BLOB.
 *
 *   에셋 일관성 2단계:
 *   - Tier 1: LoRA 사용 가능 시 → LoRA 체인 적용 (trigger word 포함)
 *   - Tier 2: CHARACTER/NPC 앵커 있음 → PuLID(얼굴 정체성 주입)
 *   앵커 없는 에셋 → generateSnapsStream 시작 시 autoGenerateAnchor() 자동 호출
 *
 * @usage features/episode/snap/router.js에서 호출.
 * @connects services/comfyui/client.js, workflows/fluxSnapWithAnchors.js, storage/oracle/blobStorage.js
 * @doc docs/05-episode.md (5. 스냅 이미지 생성)
 */
const { comfyui } = require('../../../services/comfyui/client');
const { buildFluxSnapWithAnchors } = require('../../../services/comfyui/workflows/fluxSnapWithAnchors');
const { storage } = require('../../../storage/oracle/blobStorage');
const { ImageCategory } = require('../../../storage/constants');
const { withConnection } = require('../../../app/database');
const { logError } = require('../../../app/logger');
const { autoGenerateAnchor } = require('../../visual/anchor/service');
const { ensureLorasDeployed } = require('./loraDeployer');

const FACE_ASSET_TYPES = new Set(['CHARACTER', 'NPC']);

/** CLOB/string 값 읽기 헬퍼 */
async function readClob(val) {
  if (!val) return null;
  if (typeof val === 'object' && typeof val.getData === 'function') return val.getData();
  return val;
}

/** JSON 파싱 헬퍼 (실패 시 null) */
function safeJson(val) {
  if (!val) return null;
  const s = typeof val === 'object' && typeof val.getData === 'function' ? val.getData() : val;
  try {
    const parsed = JSON.parse(s);
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch { return null; }
}

function collectAssetIds(scenes) {
  const ids = new Set();
  for (const scene of scenes) {
    if (Array.isArray(scene.characters)) scene.characters.forEach((id) => ids.add(id));
    if (scene.location_asset) ids.add(scene.location_asset);
  }
  return [...ids];
}

async function fetchAssetMap(assetIds) {
  if (!assetIds.length) return {};
  const map = {};
  await withConnection(async (conn) => {
    const placeholders = assetIds.map((_, i) => `:${i + 1}`).join(',');
    let res;
    try {
      res = await conn.execute(
        `SELECT a.asset_id, a.asset_type, a.display_name, a.visual_strategy, a.pipeline_status,
                a.trigger_word, a.appearance_prompt, a.outfit_prompt,
                a.anchor_image_id, a.outfit_anchor_id,
                sf.file_name AS lora_filename, a.lora_path AS lora_id
         FROM assets a
         LEFT JOIN system_files sf ON a.lora_path = sf.file_id
         WHERE a.asset_id IN (${placeholders})`,
        assetIds
      );
    } catch {
      res = await conn.execute(
        `SELECT a.asset_id, a.asset_type, a.display_name, a.visual_strategy, a.pipeline_status,
                a.trigger_word, a.appearance_prompt, NULL AS outfit_prompt,
                a.anchor_image_id, NULL AS outfit_anchor_id,
                sf.file_name AS lora_filename, a.lora_path AS lora_id
         FROM assets a
         LEFT JOIN system_files sf ON a.lora_path = sf.file_id
         WHERE a.asset_id IN (${placeholders})`,
        assetIds
      );
    }
    for (const row of res.rows) {
      const [assetId, assetType, displayName, visualStrategy, pipelineStatus,
        triggerWord, appearancePrompt, outfitPrompt,
        anchorImageId, outfitAnchorId, loraFilename, loraId] = row;
      map[assetId] = {
        assetId, assetType, displayName, visualStrategy, pipelineStatus,
        triggerWord, appearancePrompt, outfitPrompt,
        anchorImageId, outfitAnchorId, loraFilename, loraId,
      };
    }
  });
  return map;
}

/**
 * 이미지를 Oracle에서 읽어 ComfyUI에 업로드하고 파일명을 반환한다.
 */
async function uploadAnchorToComfyUI(imageId, filename) {
  try {
    const buffer = await storage.getImageBytes(imageId);
    const result = await comfyui.uploadImage(buffer, filename);
    return result.name;
  } catch (err) {
    logError('snap.uploadAnchor', err, { imageId, filename });
    return null;
  }
}

/**
 * render_prompt를 최종 이미지 프롬프트로 조립한다.
 *
 * 설계 원칙:
 * - Chain 4가 만든 5블록 render_prompt를 최종 프롬프트로 그대로 통과시킨다.
 * - "A cinematic photograph of..." 래핑, SD1.5 품질 태그, appearance/outfit 중복 추가를 하지 않는다.
 *   Flux T5 인코더는 자연어를 이해하며 품질 태그에 반응하지 않는다.
 * - LoRA 활성화에 필요한 trigger word가 render_prompt에 누락된 경우에만 앞에 보충한다.
 *   (Chain 4 가이드가 trigger word 삽입을 지시하지만 LLM이 누락할 경우 안전망)
 */
function augmentPrompt(basePrompt, sceneAssets) {
  const missingTriggers = [];

  for (const asset of sceneAssets) {
    if (asset.visualStrategy === 'LORA' && asset.triggerWord) {
      const cleanTrigger = asset.triggerWord.replace(/_char$/, '');
      // Chain 4가 이미 trigger word를 삽입했을 수 있으므로 중복 방지
      if (!basePrompt.toLowerCase().includes(cleanTrigger.toLowerCase())) {
        missingTriggers.push(cleanTrigger);
      }
    }
  }

  // 누락된 trigger word만 앞에 추가하고, render_prompt는 그대로 유지
  if (missingTriggers.length > 0) {
    return `${missingTriggers.join(', ')}, ${basePrompt}`;
  }
  return basePrompt;
}

/**
 * 단일 샷의 스냅 이미지를 생성하고 DB에 저장한다.
 */
async function generateSnapWithMap(projectId, episodeId, sceneNumber, shotNumber, assetMap, comfyUploadCache) {
  const data = await withConnection(async (conn) => {
    const shotRes = await conn.execute(
      `SELECT shot_id, render_prompt FROM shots
       WHERE episode_id = :1 AND scene_number = :2 AND shot_number = :3`,
      [episodeId, parseInt(sceneNumber, 10), parseInt(shotNumber, 10)]
    );
    if (!shotRes.rows.length) return null;
    const [shotId, renderPromptRaw] = shotRes.rows[0];

    const epRes = await conn.execute(
      'SELECT skeleton_json, hint FROM episodes WHERE episode_id = :1',
      [episodeId]
    );
    const [skelRaw, hintRaw] = epRes.rows[0];
    return { shotId, renderPromptRaw, skelRaw, hintRaw };
  });

  if (!data) throw new Error(`Shot not found: scene ${sceneNumber}, shot ${shotNumber}`);

  const renderPromptBase = await readClob(data.renderPromptRaw);
  const skeleton = safeJson(data.skelRaw) || safeJson(data.hintRaw) || {};
  const scenes = Array.isArray(skeleton) ? skeleton : (skeleton.scenes || []);
  const currentScene = scenes.find((s) => parseInt(s.scene_number, 10) === parseInt(sceneNumber, 10));
  const sceneCharIds = currentScene && Array.isArray(currentScene.characters)
    ? [...new Set(currentScene.characters.filter(Boolean))]
    : [];
  const locationId = currentScene?.location_asset;

  const sceneAssetIds = [...new Set([...sceneCharIds, locationId].filter(Boolean))];
  const sceneAssets = sceneAssetIds.map((id) => assetMap[id]).filter(Boolean);

  const loras = [];
  const faceRefs = [];

  for (const asset of sceneAssets) {
    if (asset.visualStrategy === 'LORA' && asset.loraFilename) {
      loras.push({ path: asset.loraFilename.replace(/\\/g, '/'), loraId: asset.loraId, strength: 1.0, trigger: asset.triggerWord });
    }
    if (asset.anchorImageId && FACE_ASSET_TYPES.has(asset.assetType)) {
      const faceKey = `face_${asset.anchorImageId}`;
      if (!comfyUploadCache[faceKey]) {
        comfyUploadCache[faceKey] = await uploadAnchorToComfyUI(asset.anchorImageId, `face_${asset.assetId}.png`);
      }
      if (comfyUploadCache[faceKey]) faceRefs.push({ imageName: comfyUploadCache[faceKey] });
    }
  }

  const augmentedPrompt = augmentPrompt(renderPromptBase, sceneAssets);
  await ensureLorasDeployed(loras);

  let history;
  let activeFaceRefs = [...faceRefs];
  let activeLoras = [...loras];

  for (let attempt = 0; attempt < 5; attempt++) {
    const workflow = buildFluxSnapWithAnchors(augmentedPrompt, null, activeLoras, activeFaceRefs);
    try {
      const promptId = await comfyui.queuePrompt(workflow);
      history = await comfyui.pollResult(promptId);
    } catch (err) {
      const errStr = err.message || '';
      console.warn(`[SnapService] Validation failed (attempt ${attempt}): ${errStr}`);
      if (activeFaceRefs.length > 0 && (errStr.includes('PuLID') || errStr.includes('Value not in list'))) {
        activeFaceRefs = []; continue;
      }
      if (activeLoras.length > 0 && (errStr.includes('LoraLoader') || errStr.includes('Value not in list'))) {
        activeLoras = []; continue;
      }
      throw err;
    }

    if (history.status?.status_str !== 'error') break;

    const msgs = (history.status?.messages || [])
      .filter((m) => m[0] === 'execution_error')
      .map((m) => m[1]?.exception_message || m[1]?.message || 'unknown')
      .join('; ');

    console.warn(`[SnapService] Execution error (attempt ${attempt}): ${msgs}`);
    if (msgs.includes('OutOfMemoryError') || msgs.includes('Allocation')) {
      await comfyui.freeMemory();
    }
    if (activeFaceRefs.length > 0) { activeFaceRefs = []; continue; }
    if (activeLoras.length > 0) { activeLoras = []; continue; }
    throw new Error(`ComfyUI execution failed after all fallbacks: ${msgs}`);
  }

  const images = comfyui.extractOutputImages(history);
  if (!images.length) throw new Error('ComfyUI returned no images');

  const imgInfo = images[0];
  const imageBuffer = await comfyui.downloadImage(imgInfo.filename, imgInfo.subfolder, imgInfo.type);
  const imageId = await storage.saveImage(projectId, null, ImageCategory.SNAP, imageBuffer);

  await withConnection(async (conn) => {
    await conn.execute('UPDATE shots SET snap_image_id = :1 WHERE shot_id = :2', [imageId, data.shotId], { autoCommit: true });
  });

  return { scene_number: parseInt(sceneNumber, 10), shot_number: parseInt(shotNumber, 10), snap_image_id: imageId, snap_image: `/api/visual/images/${imageId}` };
}

async function generateSnap(projectId, episodeId, sceneNumber, shotNumber) {
  const { skelRaw, hintRaw, visualStyle } = await withConnection(async (conn) => {
    const [epRes, projRes] = await Promise.all([
      conn.execute('SELECT skeleton_json, hint FROM episodes WHERE episode_id = :1', [episodeId]),
      conn.execute('SELECT visual_style FROM projects WHERE project_id = :1', [projectId]),
    ]);
    return { skelRaw: epRes.rows[0]?.[0], hintRaw: epRes.rows[0]?.[1], visualStyle: projRes.rows[0]?.[0] || 'PHOTOREALISTIC' };
  });
  const skeleton = safeJson(skelRaw) || safeJson(hintRaw) || {};
  const scenes = Array.isArray(skeleton) ? skeleton : (skeleton.scenes || []);
  const allAssetIds = collectAssetIds(scenes);
  const assetMap = await fetchAssetMap(allAssetIds);
  await ensureAnchors(projectId, assetMap, visualStyle);
  return generateSnapWithMap(projectId, episodeId, sceneNumber, shotNumber, assetMap, {});
}

async function* generateSnapsStream(projectId, episodeId, force = false) {
  const { shots, visualStyle, skelRaw, hintRaw } = await withConnection(async (conn) => {
    const query = `SELECT scene_number, shot_number FROM shots WHERE episode_id = :1 ${force ? '' : 'AND snap_image_id IS NULL'} ORDER BY scene_number, shot_number`;
    const [shotRes, projRes, epRes] = await Promise.all([
      conn.execute(query, [episodeId]),
      conn.execute('SELECT visual_style FROM projects WHERE project_id = :1', [projectId]),
      conn.execute('SELECT skeleton_json, hint FROM episodes WHERE episode_id = :1', [episodeId]),
    ]);
    return { shots: shotRes.rows.map(([sn, sh]) => ({ sceneNumber: sn, shotNumber: sh })), visualStyle: projRes.rows[0]?.[0] || 'PHOTOREALISTIC', skelRaw: epRes.rows[0]?.[0], hintRaw: epRes.rows[0]?.[1] };
  });
  yield { type: 'init', total: shots.length };
  if (!shots.length) return;
  const skeleton = safeJson(skelRaw) || safeJson(hintRaw) || {};
  const scenes = Array.isArray(skeleton) ? skeleton : (skeleton.scenes || []);
  const allAssetIds = collectAssetIds(scenes);
  const assetMap = await fetchAssetMap(allAssetIds);
  for await (const evt of anchorGenerationStream(projectId, assetMap, visualStyle)) yield evt;
  await comfyui.freeMemory();
  const comfyUploadCache = {};
  for (const { sceneNumber, shotNumber } of shots) {
    yield { type: 'snap_generating', scene_number: sceneNumber, shot_number: shotNumber };
    try {
      const result = await generateSnapWithMap(projectId, episodeId, sceneNumber, shotNumber, assetMap, comfyUploadCache);
      yield result;
    } catch (err) {
      logError('snap.generateSnapsStream', err, { projectId, episodeId, sceneNumber, shotNumber });
      yield { type: 'error', scene_number: sceneNumber, shot_number: shotNumber, message: err.message };
    }
  }
}

async function* anchorGenerationStream(projectId, assetMap, visualStyle) {
  const missing = Object.values(assetMap).filter((a) => !a.anchorImageId);
  for (const asset of missing) {
    yield { type: 'anchor_generating', asset_id: asset.assetId, display_name: asset.displayName };
    const result = await autoGenerateAnchor(projectId, asset.assetId, asset.assetType, asset.appearancePrompt, visualStyle, asset.outfitPrompt || '');
    if (result) asset.anchorImageId = result.image_id;
  }
}

async function ensureAnchors(projectId, assetMap, visualStyle = 'PHOTOREALISTIC') {
  const missing = Object.values(assetMap).filter((a) => !a.anchorImageId);
  for (const asset of missing) {
    const result = await autoGenerateAnchor(
      projectId, asset.assetId, asset.assetType, asset.appearancePrompt, visualStyle
    );
    if (result) asset.anchorImageId = result.image_id;
  }
}

module.exports = { generateSnap, generateSnapsStream };
