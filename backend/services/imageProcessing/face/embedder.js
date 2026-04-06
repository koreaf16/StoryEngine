/**
 * @file services/imageProcessing/face/embedder.js
 * @description 얼굴 임베딩(128-d 벡터) 추출. @vladmandic/face-api 기반.
 * @usage features/visual/anchor/service.js에서 앵커 확정 시 임베딩 저장 용도.
 * @connects @vladmandic/face-api, canvas
 * @doc docs/04-visual-factory.md
 */
const { loadFaceModels } = require('./detector');

let faceapi = null;
let canvas = null;

async function ensureLoaded() {
  if (faceapi) return true;
  const loaded = await loadFaceModels();
  if (!loaded) return false;
  faceapi = require('@vladmandic/face-api');
  canvas = require('canvas');
  return true;
}

/**
 * 이미지에서 첫 번째 얼굴의 128-d 임베딩 반환.
 * @returns {number[] | null}
 */
async function getFaceEmbedding(imagePath) {
  if (!(await ensureLoaded())) return null;
  const img = await canvas.loadImage(imagePath);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor);
}

module.exports = { getFaceEmbedding };
