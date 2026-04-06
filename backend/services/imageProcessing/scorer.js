/**
 * @file services/imageProcessing/scorer.js
 * @description 이미지 품질 채점 (S/A/B/C 등급). 선명도(Laplacian), 밝기, 얼굴 감지 분석.
 * @usage features/visual/anchor, features/visual/derived 서비스에서 이미지 품질 평가 시 사용.
 * @connects sharp, services/imageProcessing/face/detector.js
 * @doc docs/04-visual-factory.md
 */
const sharp = require('sharp');
const { hasFace } = require('./face/detector');

/**
 * Laplacian 커널 적용 후 분산 계산 → 선명도 점수.
 * 높을수록 선명.
 */
async function laplacianVariance(imagePath) {
  const { data, info } = await sharp(imagePath)
    .greyscale()
    .convolve({
      width: 3,
      height: 3,
      kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Int8Array(data.buffer);
  const n = pixels.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += pixels[i];
  const mean = sum / n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (pixels[i] - mean) ** 2;
  return variance / n;
}

/**
 * 평균 밝기 (0~255). 적정 범위: 80~200.
 */
async function brightnessScore(imagePath) {
  const stats = await sharp(imagePath).stats();
  const totalMean = stats.channels.reduce((acc, ch) => acc + ch.mean, 0) / stats.channels.length;
  return totalMean;
}

/**
 * 이미지 품질 등급 반환: 'S' | 'A' | 'B' | 'C'
 */
async function scoreImage(imagePath) {
  const [sharpness, brightness, faceDetected] = await Promise.all([
    laplacianVariance(imagePath),
    brightnessScore(imagePath),
    hasFace(imagePath),
  ]);

  const brightnessOk = brightness >= 80 && brightness <= 200;

  if (faceDetected && sharpness > 500 && brightnessOk) return 'S';
  if (faceDetected && sharpness > 200) return 'A';
  if (sharpness > 50) return 'B';
  return 'C';
}

module.exports = { scoreImage };
