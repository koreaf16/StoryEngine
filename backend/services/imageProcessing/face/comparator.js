/**
 * @file services/imageProcessing/face/comparator.js
 * @description 앵커 얼굴 임베딩과 대상 이미지 간 얼굴 거리 비교 및 일치 여부 판정.
 * @usage features/visual/derived/service.js에서 파생 이미지 필터링 시 사용.
 * @connects services/imageProcessing/face/embedder.js, app/config.js
 * @doc docs/04-visual-factory.md
 */
const { getFaceEmbedding } = require('./embedder');
const { FACE_THRESHOLD } = require('../../../app/config');

/**
 * 유클리디안 거리 계산.
 */
function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

/**
 * 앵커 임베딩과 대상 이미지의 얼굴 거리 계산.
 * @returns {number | null} 낮을수록 유사, 얼굴 미감지 시 null
 */
async function computeFaceDistance(anchorEmbedding, targetImagePath) {
  const targetEmbedding = await getFaceEmbedding(targetImagePath);
  if (!targetEmbedding) return null;
  return euclideanDistance(anchorEmbedding, targetEmbedding);
}

/**
 * 얼굴 일치 여부 판정.
 * @returns {[boolean, number | null]} [passed, distance]
 */
async function isFaceMatch(anchorEmbedding, targetImagePath, threshold = FACE_THRESHOLD) {
  const dist = await computeFaceDistance(anchorEmbedding, targetImagePath);
  if (dist === null) return [false, null];
  return [dist < threshold, dist];
}

module.exports = { computeFaceDistance, isFaceMatch };
