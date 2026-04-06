/**
 * @file features/visual/anchor/service.js
 * @description 앵커 이미지 생성 비즈니스 로직. ComfyUI Flux 2 Dev로 후보 N장 생성, 저장 및 채점 처리.
 * @usage features/visual/anchor/router.js에서 API 핸들러로 호출.
 * @connects services/comfyui/client.js, services/imageProcessing/, storage/oracle/blobStorage.js
 * @doc docs/04-visual-factory.md
 */
const { comfyui } = require('../../../services/comfyui/client');
const { buildFluxAnchor } = require('../../../services/comfyui/workflows/fluxAnchor');
const { buildPulidAnchor } = require('../../../services/comfyui/workflows/pulidAnchor');
const { scoreImage } = require('../../../services/imageProcessing/scorer');
const { getPrimaryFaceBbox } = require('../../../services/imageProcessing/face/detector');
const { getFaceEmbedding } = require('../../../services/imageProcessing/face/embedder');
const { storage } = require('../../../storage/oracle/blobStorage');
const { ImageCategory } = require('../../../storage/constants');
const { withConnection } = require('../../../app/database');
const { logError } = require('../../../app/logger');

async function generateOne(projectId, assetId, assetType, prompt, index, visualStyle = 'PHOTOREALISTIC', imageName = null, weight = 1.4) {
  try {
    const workflow = imageName
      ? buildPulidAnchor(prompt, visualStyle, assetType, imageName, null, undefined, undefined, weight)
      : buildFluxAnchor(prompt, visualStyle, assetType);

    const promptId = await comfyui.queuePrompt(workflow);
    const history = await comfyui.pollResult(promptId);
    const images = comfyui.extractOutputImages(history);
    if (!images.length) return null;

    const imgInfo = images[0];
    const imageBuffer = await comfyui.downloadImage(imgInfo.filename, imgInfo.subfolder, imgInfo.type);
    const imageId = await storage.saveImage(projectId, assetId, ImageCategory.ANCHOR_CANDIDATE, imageBuffer);
    const imagePath = await storage.getImagePath(imageId);
    const grade = await scoreImage(imagePath);

    return { index, image_id: imageId, grade, image_url: `/api/visual/images/${imageId}` };
  } catch (err) {
        logError('anchor.generateOne', err, { projectId, assetId, index, visualStyle, imageName, assetType });
    return null;
  }
}

/**
 * 비동기 제너레이터: 후보 이미지가 완료되는 순서로 하나씩 yield.
 */
async function* generateAnchorStream(projectId, assetId, assetType, appearancePrompt, count, visualStyle = 'PHOTOREALISTIC', imageName = null, weight = 1.4) {
  // 플로우 전환 대비 VRAM 초기화 (LoRA 학습 등 직전 작업 잔류 메모리 해제)
  await comfyui.freeMemory();
  for (let i = 0; i < count; i++) {
    const result = await generateOne(projectId, assetId, assetType, appearancePrompt, i, visualStyle, imageName, weight);
    if (result) yield result;
  }
}

async function confirmAnchor(projectId, assetId, candidateImageId) {
  const imagePath = await storage.getImagePath(candidateImageId);
  const [grade, faceBbox, embedding] = await Promise.all([
    scoreImage(imagePath),
    getPrimaryFaceBbox(imagePath),
    getFaceEmbedding(imagePath),
  ]);

  const assetType = await withConnection(async (conn) => {
    const result = await conn.execute(
      'SELECT asset_type FROM assets WHERE project_id = :1 AND asset_id = :2',
      [projectId, assetId]
    );
    return result.rows[0]?.[0] || null;
  });
  const requiresFaceAnchor = assetType === 'CHARACTER' || assetType === 'NPC';
  if (requiresFaceAnchor && !embedding) {
    const err = new Error('Face-visible anchors are required for CHARACTER/NPC assets.');
    err.status = 400;
    throw err;
  }

  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE assets SET anchor_image_id = :1, anchor_embedding = :2, pipeline_status = 'ANCHOR_SELECTED'
       WHERE asset_id = :3`,
      [candidateImageId, embedding ? JSON.stringify(embedding) : null, assetId],
      { autoCommit: true }
    );
  });

  return {
    image_id: candidateImageId,
    image_url: `/api/visual/images/${candidateImageId}`,
    grade,
    face_bbox: faceBbox,
    embedding,
  };
}

async function uploadAnchorCandidate(projectId, assetId, imageBuffer, index) {
  const imageId = await storage.saveImage(projectId, assetId, ImageCategory.ANCHOR_CANDIDATE, imageBuffer);
  const imagePath = await storage.getImagePath(imageId);
  const grade = await scoreImage(imagePath);
  return { index, image_id: imageId, grade, image_url: `/api/visual/images/${imageId}` };
}

/**
 * 앵커가 없는 에셋에 대해 1장 자동 생성+확정한다. 스냅 생성 전 일괄 호출용.
 * CHARACTER/NPC는 얼굴 감지 실패 시 최대 3회 재시도.
 * LOCATION/ITEM/MONSTER는 얼굴 감지 없이 1회 생성 후 바로 확정.
 *
 * @param {string} outfitPrompt - 의상 묘사 (CHARACTER/NPC에서 appearance와 합쳐 전체 외모 구성)
 * @returns {{ image_id: string, image_url: string, grade: string } | null}
 */
async function autoGenerateAnchor(projectId, assetId, assetType, appearancePrompt, visualStyle = 'PHOTOREALISTIC', outfitPrompt = '') {
  const requiresFace = assetType === 'CHARACTER' || assetType === 'NPC';
  const maxAttempts = requiresFace ? 3 : 1;

  // CHARACTER/NPC: 얼굴+의상을 하나의 프롬프트로 구성
  const fullPrompt = (requiresFace && outfitPrompt)
    ? `${appearancePrompt}, wearing ${outfitPrompt}`
    : appearancePrompt;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = await generateOne(projectId, assetId, assetType, fullPrompt, attempt, visualStyle);
    if (!candidate) continue;

    if (!requiresFace) {
      // 비캐릭터: 얼굴 감지 없이 바로 확정 (confirmAnchor는 CHARACTER/NPC에 얼굴 강제하므로 직접 UPDATE)
      await withConnection(async (conn) => {
        await conn.execute(
          `UPDATE assets SET anchor_image_id = :1, pipeline_status = 'ANCHOR_SELECTED'
           WHERE asset_id = :2`,
          [candidate.image_id, assetId],
          { autoCommit: true }
        );
      });
      return { image_id: candidate.image_id, image_url: candidate.image_url, grade: candidate.grade };
    }

    // CHARACTER/NPC: confirmAnchor 호출 (얼굴 감지 + 임베딩 저장)
    try {
      const result = await confirmAnchor(projectId, assetId, candidate.image_id);
      return result;
    } catch (err) {
      // 얼굴 미감지 → 재시도
      logError('anchor.autoGenerate.faceNotFound', err, { projectId, assetId, attempt });
    }
  }

  logError('anchor.autoGenerate.failed', new Error('Max attempts exceeded'), { projectId, assetId, assetType });
  return null;
}

module.exports = { generateAnchorStream, confirmAnchor, uploadAnchorCandidate, autoGenerateAnchor };




