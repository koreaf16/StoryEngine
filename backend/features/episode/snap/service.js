/**
 * @file features/episode/snap/service.js
 * @description 스냅 이미지 생성 비즈니스 로직.
 *   샷의 render_prompt → (자동 앵커 생성) → PuLID + IP-Adapter + LoRA 3중 참조 → Flux Dev → Oracle BLOB.
 *
 *   에셋 일관성 2단계:
 *   - Tier 1: LoRA 학습 완료 → LoRA 체인 적용 (trigger word 프롬프트 삽입 포함)
 *   - Tier 2: 앵커 이미지 있음 → CHARACTER/NPC: PuLID(얼굴)+IP-Adapter(의상), 비캐릭터: IP-Adapter(스타일)
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

/**
 * 에피소드의 모든 씬에 등장하는 고유 에셋 ID를 수집한다.
 */
function collectAssetIds(scenes) {
  const ids = new Set();
  for (const scene of scenes) {
    if (Array.isArray(scene.characters)) scene.characters.forEach((id) => ids.add(id));
    if (scene.location_asset) ids.add(scene.location_asset);
  }
  return [...ids];
}

/**
 * 에셋 ID 목록에 대해 DB 정보를 일괄 조회한다.
 * outfit_prompt / outfit_anchor_id 컬럼은 없어도 null로 처리.
 */
async function fetchAssetMap(assetIds) {
  if (!assetIds.length) return {};
  const map = {};
  await withConnection(async (conn) => {
    const placeholders = assetIds.map((_, i) => `:${i + 1}`).join(',');
    // outfit_prompt, outfit_anchor_id는 아직 없을 수 있으므로 try-catch로 fallback
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
      // outfit 컬럼 없으면 기본 쿼리로 fallback
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
 * 앵커가 없는 에셋들에 대해 autoGenerateAnchor를 호출하고, assetMap을 갱신한다.
 */
async function ensureAnchors(projectId, assetMap, visualStyle = 'PHOTOREALISTIC') {
  const missing = Object.values(assetMap).filter((a) => !a.anchorImageId);
  for (const asset of missing) {
    const result = await autoGenerateAnchor(
      projectId, asset.assetId, asset.assetType, asset.appearancePrompt, visualStyle
    );
    if (result) asset.anchorImageId = result.image_id;
  }
}

/**
 * 이미지를 Oracle에서 읽어 ComfyUI에 업로드하고 파일명을 반환한다.
 * 실패 시 null 반환 (스냅 생성은 참조 없이 계속 진행).
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
 * render_prompt에 appearance_prompt / outfit_prompt 텍스트 보강을 추가한다.
 */
function augmentPrompt(basePrompt, sceneAssets) {
  let prompt = basePrompt;
  const triggers = [];

  for (const asset of sceneAssets) {
    // Tier 1: trigger word 강제 삽입
    if (asset.visualStrategy === 'LORA' && asset.pipelineStatus === 'LORA_TRAINED' && asset.triggerWord) {
      triggers.push(`(${asset.triggerWord}:1.3)`);
    }
    // PROMPT 전략 에셋의 appearance_prompt 합성
    if (asset.visualStrategy === 'PROMPT' && asset.appearancePrompt) {
      prompt += `, ${asset.appearancePrompt}`;
    }
    // 의상 정보 합성 (모든 CHARACTER/NPC)
    if (FACE_ASSET_TYPES.has(asset.assetType) && asset.outfitPrompt) {
      prompt += `, ${asset.displayName} wearing ${asset.outfitPrompt}`;
    }
  }

  if (triggers.length) {
    prompt = `${triggers.join(', ')}, ${prompt}`;
  }
  return prompt;
}

/**
 * 단일 샷의 스냅 이미지를 생성하고 DB에 저장한다.
 * assetMap과 comfyUploadCache(key→comfyFilename)를 외부에서 주입받아 재사용한다.
 */
async function generateSnapWithMap(projectId, episodeId, sceneNumber, shotNumber, assetMap, comfyUploadCache) {
  // 1. 샷 정보 조회
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

  // 씬 등장 에셋 수집
  const sceneAssetIds = [...new Set([...sceneCharIds, locationId].filter(Boolean))];
  const sceneAssets = sceneAssetIds.map((id) => assetMap[id]).filter(Boolean);

  // 2. Tier 분류 + 앵커 업로드 (캐시 활용)
  const loras = [];
  const faceRefs = [];
  const styleRefs = [];

  for (const asset of sceneAssets) {
    // Tier 1: LoRA (Flux 2 학습된 경우에만 유효 — Flux 1 LoRA는 ComfyUI가 자동 skip)
    if (asset.visualStrategy === 'LORA' && asset.pipelineStatus === 'LORA_TRAINED' && asset.loraFilename) {
      loras.push({ path: asset.loraFilename, loraId: asset.loraId, strength: 1.0, trigger: asset.triggerWord });
    }

    // Tier 2: 앵커 이미지 → PuLID / IP-Adapter (LoRA와 병행 적용 가능)
    // LoRA가 Flux 1 학습본이라 shape 불일치로 skip되는 경우 PuLID가 얼굴 일관성 보장
    if (asset.anchorImageId) {
      if (FACE_ASSET_TYPES.has(asset.assetType)) {
        // 얼굴 앵커 → PuLID
        const faceKey = `face_${asset.anchorImageId}`;
        if (!comfyUploadCache[faceKey]) {
          comfyUploadCache[faceKey] = await uploadAnchorToComfyUI(
            asset.anchorImageId, `face_${asset.assetId}.png`
          );
        }
        if (comfyUploadCache[faceKey]) faceRefs.push({ imageName: comfyUploadCache[faceKey] });

        // 의상 앵커 → IP-Adapter (outfit_anchor_id 우선, 없으면 일반 앵커)
        const styleAnchorId = asset.outfitAnchorId || asset.anchorImageId;
        const styleKey = `style_${styleAnchorId}`;
        if (!comfyUploadCache[styleKey]) {
          comfyUploadCache[styleKey] = await uploadAnchorToComfyUI(
            styleAnchorId, `outfit_${asset.assetId}.png`
          );
        }
        if (comfyUploadCache[styleKey]) styleRefs.push({ imageName: comfyUploadCache[styleKey] });
      } else {
        // 비캐릭터 → IP-Adapter 스타일 참조
        const styleKey = `style_${asset.anchorImageId}`;
        if (!comfyUploadCache[styleKey]) {
          comfyUploadCache[styleKey] = await uploadAnchorToComfyUI(
            asset.anchorImageId, `style_${asset.assetId}.png`
          );
        }
        if (comfyUploadCache[styleKey]) styleRefs.push({ imageName: comfyUploadCache[styleKey] });
      }
    }
  }

  // 3. 프롬프트 보강
  const augmentedPrompt = augmentPrompt(renderPromptBase, sceneAssets);

  // 4. LoRA 배포 확인 (ComfyUI에 없으면 DB에서 꺼내 배포)
  await ensureLorasDeployed(loras);

  // 5. 워크플로우 빌드 및 실행 (IP-Adapter / PuLID 실패 시 단계적 폴백)
  let history;
  let activeFaceRefs = [...faceRefs];
  let activeStyleRefs = [...styleRefs];
  let workflow = buildFluxSnapWithAnchors(augmentedPrompt, null, loras, activeFaceRefs, activeStyleRefs);
  let promptId = await comfyui.queuePrompt(workflow);
  history = await comfyui.pollResult(promptId);

  // 최대 2회 폴백: IP-Adapter 제거(img_mod) → PuLID 제거(EVA-CLIP)
  for (let retry = 0; retry < 2 && history.status?.status_str === 'error'; retry++) {
    const msgs = (history.status?.messages || [])
      .filter((m) => m[0] === 'execution_error')
      .map((m) => m[1]?.exception_message || m[1]?.message || 'unknown')
      .join('; ');

    if (activeStyleRefs.length > 0 && msgs.includes('img_mod')) {
      logError('snap.ipadapterFallback', new Error('IP-Adapter incompatible with Flux 2, retrying without style refs'), { msgs });
      activeStyleRefs = [];
    } else if (activeFaceRefs.length > 0 && (msgs.includes('EVA-CLIP') || msgs.includes('PuLID'))) {
      logError('snap.pulidFallback', new Error('PuLID unavailable, retrying without face refs'), { msgs });
      activeFaceRefs = [];
    } else {
      throw new Error(`ComfyUI execution failed: ${msgs || 'unknown error'}`);
    }

    workflow = buildFluxSnapWithAnchors(augmentedPrompt, null, loras, activeFaceRefs, activeStyleRefs);
    promptId = await comfyui.queuePrompt(workflow);
    history = await comfyui.pollResult(promptId);
  }

  if (history.status?.status_str === 'error') {
    const msgs = (history.status?.messages || [])
      .filter((m) => m[0] === 'execution_error')
      .map((m) => m[1]?.exception_message || m[1]?.message || 'unknown')
      .join('; ');
    throw new Error(`ComfyUI execution failed (after fallbacks): ${msgs || 'unknown error'}`);
  }

  const images = comfyui.extractOutputImages(history);
  if (!images.length) throw new Error('ComfyUI returned no images');

  const imgInfo = images[0];
  const imageBuffer = await comfyui.downloadImage(imgInfo.filename, imgInfo.subfolder, imgInfo.type);
  const imageId = await storage.saveImage(projectId, null, ImageCategory.SNAP, imageBuffer);

  await withConnection(async (conn) => {
    await conn.execute(
      'UPDATE shots SET snap_image_id = :1 WHERE shot_id = :2',
      [imageId, data.shotId],
      { autoCommit: true }
    );
  });

  return {
    scene_number: parseInt(sceneNumber, 10),
    shot_number: parseInt(shotNumber, 10),
    snap_image_id: imageId,
    snap_image: `/api/visual/images/${imageId}`,
  };
}

/**
 * 단일 샷 재생성 (외부 API용).
 */
async function generateSnap(projectId, episodeId, sceneNumber, shotNumber) {
  const { skelRaw, hintRaw, visualStyle } = await withConnection(async (conn) => {
    const [epRes, projRes] = await Promise.all([
      conn.execute('SELECT skeleton_json, hint FROM episodes WHERE episode_id = :1', [episodeId]),
      conn.execute('SELECT visual_style FROM projects WHERE project_id = :1', [projectId]),
    ]);
    return {
      skelRaw: epRes.rows[0]?.[0],
      hintRaw: epRes.rows[0]?.[1],
      visualStyle: projRes.rows[0]?.[0] || 'PHOTOREALISTIC',
    };
  });

  const skeleton = safeJson(skelRaw) || safeJson(hintRaw) || {};
  const scenes = Array.isArray(skeleton) ? skeleton : (skeleton.scenes || []);
  const allAssetIds = collectAssetIds(scenes);
  const assetMap = await fetchAssetMap(allAssetIds);
  await ensureAnchors(projectId, assetMap, visualStyle);

  return generateSnapWithMap(projectId, episodeId, sceneNumber, shotNumber, assetMap, {});
}

/**
 * 에피소드 내 스냅이 없는(또는 전체) 샷을 순서대로 생성하는 비동기 제너레이터.
 *
 * Phase 1: 에셋 정보 수집 + 앵커 없는 에셋 자동 생성
 * Phase 2: 앵커 이미지 ComfyUI 캐시 준비
 * Phase 3: 샷별 스냅 생성
 *
 * @yields {{ type: 'init', total }
 *          | { type: 'anchor_generating', asset_id, display_name }
 *          | { scene_number, shot_number, snap_image_id, snap_image }
 *          | { type: 'error', scene_number, shot_number, message }}
 */
async function* generateSnapsStream(projectId, episodeId, force = false) {
  // Phase 1: 샷 목록 + 프로젝트 visual_style + 에피소드 골격을 동시 조회
  const { shots, visualStyle, skelRaw, hintRaw } = await withConnection(async (conn) => {
    const query = `SELECT scene_number, shot_number FROM shots
      WHERE episode_id = :1 ${force ? '' : 'AND snap_image_id IS NULL'}
      ORDER BY scene_number, shot_number`;
    const [shotRes, projRes, epRes] = await Promise.all([
      conn.execute(query, [episodeId]),
      conn.execute('SELECT visual_style FROM projects WHERE project_id = :1', [projectId]),
      conn.execute('SELECT skeleton_json, hint FROM episodes WHERE episode_id = :1', [episodeId]),
    ]);
    return {
      shots: shotRes.rows.map(([sn, sh]) => ({ sceneNumber: sn, shotNumber: sh })),
      visualStyle: projRes.rows[0]?.[0] || 'PHOTOREALISTIC',
      skelRaw: epRes.rows[0]?.[0],
      hintRaw: epRes.rows[0]?.[1],
    };
  });

  yield { type: 'init', total: shots.length };
  if (!shots.length) return;

  // 에셋 수집 및 DB 조회
  const skeleton = safeJson(skelRaw) || safeJson(hintRaw) || {};
  const scenes = Array.isArray(skeleton) ? skeleton : (skeleton.scenes || []);
  const allAssetIds = collectAssetIds(scenes);
  const assetMap = await fetchAssetMap(allAssetIds);

  // 앵커 없는 에셋 자동 생성 — visual_style 적용 (SSE로 진행 상황 즉시 전달)
  for await (const evt of anchorGenerationStream(projectId, assetMap, visualStyle)) {
    yield evt;
  }

  // 플로우 전환 대비 VRAM 초기화 (직전 작업 잔류 메모리 해제)
  await comfyui.freeMemory();

  // Phase 2~3: 샷별 스냅 생성 (ComfyUI 업로드 캐시 공유)
  const comfyUploadCache = {};
  for (const { sceneNumber, shotNumber } of shots) {
    yield { type: 'snap_generating', scene_number: sceneNumber, shot_number: shotNumber };
    try {
      const result = await generateSnapWithMap(
        projectId, episodeId, sceneNumber, shotNumber, assetMap, comfyUploadCache
      );
      yield result;
    } catch (err) {
      logError('snap.generateSnapsStream', err, { projectId, episodeId, sceneNumber, shotNumber });
      yield { type: 'error', scene_number: sceneNumber, shot_number: shotNumber, message: err.message };
    }
  }
}

/** 앵커 없는 에셋들을 순서대로 자동 생성하는 제너레이터 (SSE 즉시 전달용). */
async function* anchorGenerationStream(projectId, assetMap, visualStyle) {
  const missing = Object.values(assetMap).filter((a) => !a.anchorImageId);
  for (const asset of missing) {
    yield { type: 'anchor_generating', asset_id: asset.assetId, display_name: asset.displayName };
    const result = await autoGenerateAnchor(
      projectId, asset.assetId, asset.assetType, asset.appearancePrompt, visualStyle, asset.outfitPrompt || ''
    );
    if (result) asset.anchorImageId = result.image_id;
  }
}

module.exports = { generateSnap, generateSnapsStream };
