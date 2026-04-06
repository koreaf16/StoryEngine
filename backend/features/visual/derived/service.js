/**
 * @file features/visual/derived/service.js
 * @description 파생 이미지 생성 + 얼굴 필터링 로직. 에셋 타입별 프리셋으로 Kontext 워크플로우를 반복 호출.
 * @usage features/visual/derived/router.js에서 호출.
 * @connects services/comfyui/client.js, services/imageProcessing/face/comparator.js, storage
 * @doc docs/04-visual-factory.md
 */
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { comfyui } = require('../../../services/comfyui/client');
const { buildKontextEdit } = require('../../../services/comfyui/workflows/kontextEdit');
const { isFaceMatch } = require('../../../services/imageProcessing/face/comparator');
const { storage } = require('../../../storage/oracle/blobStorage');
const { ImageCategory } = require('../../../storage/constants');
const { withConnection } = require('../../../app/database');
const { PRESETS, PRESET_PROMPTS, FIXED_SEED } = require('./presets');
const { FACE_THRESHOLD } = require('../../../app/config');
const { logError } = require('../../../app/logger');
const FACE_FILTER_ASSET_TYPES = new Set(['CHARACTER', 'NPC']);
const SKIPPED_FILTER_ASSET_TYPES = new Set(['MONSTER', 'LOCATION', 'ITEM']);

async function* generateDerivedStream(projectId, assetId, assetType, anchorImageId, appearancePrompt, targetPresets = null, outfitPrompt = '') {
  let presets = PRESETS[assetType] || PRESETS.CHARACTER;
  if (targetPresets && targetPresets.length) {
    presets = presets.filter((p) => targetPresets.includes(p.key));
  }

  // 기존 파생 이미지 삭제 로직 (중복 방지)
  try {
    const targetPresetLabels = presets.map((p) => p.label);
    const imagesToDelete = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT f.file_id, d.preset_name
         FROM system_files f
         JOIN asset_derived_images d ON f.file_id = d.image_id
         WHERE f.asset_id = :1 AND f.file_category = 'derived'`,
        [assetId]
      );

      const toDelete = [];
      for (const row of result.rows) {
        const [imgId, presetName] = row;
        const isTarget = (!targetPresets || targetPresets.length === 0) ? true : targetPresetLabels.includes(presetName);
        if (isTarget) {
          toDelete.push(imgId);
          await conn.execute(`DELETE FROM asset_derived_images WHERE image_id = :1`, [imgId]);
        }
      }
      if (toDelete.length > 0) {
        await conn.commit();
      }
      return toDelete;
    });

    for (const imgId of imagesToDelete) {
      await storage.deleteImage(imgId);
    }
  } catch (err) {
    logError('derived.deleteExisting', err, { projectId, assetId });
  }

  // 플로우 전환 대비 VRAM 초기화 (LoRA 학습 등 직전 작업 잔류 메모리 해제)
  await comfyui.freeMemory();

  // 앵커 이미지를 한 번만 ComfyUI에 업로드
  let comfyImageName;
  try {
    const anchorPath = await storage.getImagePath(anchorImageId);
    const fs = require('fs');
    const anchorBytes = fs.readFileSync(anchorPath);
    const remoteFilename = `anchor_${uuidv4()}.png`;
    const uploadInfo = await comfyui.uploadImage(anchorBytes, remoteFilename);
    comfyImageName = uploadInfo.name;
  } catch (err) {
    logError('derived.uploadAnchor', err, { projectId, assetId, anchorImageId });
    return;
  }

  const outfitSuffix = outfitPrompt ? `, wearing ${outfitPrompt}` : '';
  const generatedMap = {}; // preset key → image_id

  for (const preset of presets) {
    let result;
    if (preset.mirror_of && generatedMap[preset.mirror_of]) {
      result = await mirrorDerived(projectId, assetId, generatedMap[preset.mirror_of], preset);
    } else {
      result = await generateOneDerived(projectId, assetId, comfyImageName, preset, outfitSuffix);
    }
    if (result) {
      generatedMap[preset.key] = result.image_id;
      yield result;
    }
  }
}

async function generateOneDerived(projectId, assetId, comfyImageName, preset, outfitSuffix = '') {
  try {
    const editPrompt = (PRESET_PROMPTS[preset.key] || '').replace('{outfitPrompt}', outfitSuffix);
    const seed = preset.seed_mode === 'fixed' ? FIXED_SEED : null;
    const workflow = buildKontextEdit(comfyImageName, editPrompt, seed);

    const promptId = await comfyui.queuePrompt(workflow);
    const history = await comfyui.pollResult(promptId);
    const imagesInfo = comfyui.extractOutputImages(history);
    if (!imagesInfo.length) return null;

    const imgBytes = await comfyui.downloadImage(imagesInfo[0].filename, imagesInfo[0].subfolder, imagesInfo[0].type);
    const imageId = await storage.saveImage(projectId, assetId, ImageCategory.DERIVED, imgBytes);

    await withConnection(async (conn) => {
      await conn.execute(
        'INSERT INTO asset_derived_images (image_id, preset_name, is_passed) VALUES (:1, :2, :3)',
        [imageId, preset.label, null],
        { autoCommit: true }
      );
    });

    return {
      image_id: imageId,
      preset_key: preset.key,
      preset_name: preset.label,
      category: preset.category,
      image_url: `/api/visual/images/${imageId}`,
      skip_similarity: preset.skip_similarity || false,
    };
  } catch (err) {
        logError('derived.generateOne', err, { projectId, assetId, presetKey: preset.key });
    return null;
  }
}

async function mirrorDerived(projectId, assetId, sourceImageId, preset) {
  try {
    const sourcePath = await storage.getImagePath(sourceImageId);
    const fs = require('fs');
    const sourceBytes = fs.readFileSync(sourcePath);
    const flippedBytes = await sharp(sourceBytes).flop().toBuffer();

    const imageId = await storage.saveImage(projectId, assetId, ImageCategory.DERIVED, flippedBytes);

    await withConnection(async (conn) => {
      await conn.execute(
        'INSERT INTO asset_derived_images (image_id, preset_name, is_passed) VALUES (:1, :2, :3)',
        [imageId, preset.label, null],
        { autoCommit: true }
      );
    });

    return {
      image_id: imageId,
      preset_key: preset.key,
      preset_name: preset.label,
      category: preset.category,
      image_url: `/api/visual/images/${imageId}`,
      skip_similarity: preset.skip_similarity || false,
    };
  } catch (err) {
    logError('derived.mirror', err, { projectId, assetId, sourceImageId, presetKey: preset.key });
    return null;
  }
}

async function filterDerivedImages(assetType, anchorEmbedding, images, faceThreshold = FACE_THRESHOLD) {
  const results = [];
  await withConnection(async (conn) => {
    for (const img of images) {
      if (SKIPPED_FILTER_ASSET_TYPES.has(assetType) || img.skip_similarity) {
        await conn.execute(
          'UPDATE asset_derived_images SET face_distance = :1, is_passed = :2 WHERE image_id = :3',
          [null, null, img.image_id]
        );
        results.push({ ...img, face_distance: null, filter_result: 'SKIP' });
        continue;
      }

      if (!FACE_FILTER_ASSET_TYPES.has(assetType) || !anchorEmbedding) {
        await conn.execute(
          'UPDATE asset_derived_images SET face_distance = :1, is_passed = :2 WHERE image_id = :3',
          [null, null, img.image_id]
        );
        results.push({ ...img, face_distance: null, filter_result: 'SKIP' });
        continue;
      }

      const imagePath = await storage.getImagePath(img.image_id);
      const [passed, distance] = await isFaceMatch(anchorEmbedding, imagePath, faceThreshold);

      if (distance === null) {
        await conn.execute(
          'UPDATE asset_derived_images SET face_distance = :1, is_passed = :2 WHERE image_id = :3',
          [null, null, img.image_id]
        );
        results.push({ ...img, face_distance: null, filter_result: 'SKIP' });
        continue;
      }

      await conn.execute(
        'UPDATE asset_derived_images SET face_distance = :1, is_passed = :2 WHERE image_id = :3',
        [distance, passed ? 1 : 0, img.image_id]
      );
      results.push({ ...img, face_distance: distance, filter_result: passed ? 'PASS' : 'FAIL' });
    }
    await conn.commit();
  });
  return results;
}

module.exports = { generateDerivedStream, filterDerivedImages };


