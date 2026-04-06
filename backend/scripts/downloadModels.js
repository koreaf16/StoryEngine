/**
 * @file scripts/downloadModels.js
 * @description face-api.js 모델 파일 다운로드 스크립트.
 * @usage node scripts/downloadModels.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { logError, logInfo } = require('../app/logger');

const MODELS_DIR = path.join(__dirname, '../models');
const PACKAGE_MODEL_DIR = (() => {
  try {
    const packageJson = require.resolve('@vladmandic/face-api/package.json');
    return path.join(path.dirname(packageJson), 'model');
  } catch {
    return null;
  }
})();
const BASE_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';

const MODEL_FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model.bin',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model.bin',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model.bin',
];
const MIN_MODEL_FILE_SIZE = 1024;

if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });

function isUsableFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile() && stats.size > MIN_MODEL_FILE_SIZE;
  } catch {
    return false;
  }
}

function copyFromPackage(file, dest) {
  if (!PACKAGE_MODEL_DIR) return false;

  const source = path.join(PACKAGE_MODEL_DIR, file);
  if (!isUsableFile(source)) return false;

  fs.copyFileSync(source, dest);
  return true;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      const statusCode = res.statusCode || 0;

      if ([301, 302, 307, 308].includes(statusCode) && res.headers.location) {
        res.resume();
        request.destroy();
        download(new URL(res.headers.location, url).toString(), dest).then(resolve).catch(reject);
        return;
      }

      if (statusCode !== 200) {
        res.resume();
        fs.rmSync(dest, { force: true });
        reject(new Error(`Failed to download ${url}: HTTP ${statusCode}`));
        return;
      }

      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', (err) => {
        file.destroy();
        fs.rmSync(dest, { force: true });
        reject(err);
      });
    });

    request.on('error', (err) => {
      fs.rmSync(dest, { force: true });
      reject(err);
    });
  });
}

async function syncModelFile(file) {
  const dest = path.join(MODELS_DIR, file);

  if (isUsableFile(dest)) {
    logInfo('downloadModels.skip', 'Model already present', { file });
    return;
  }

  if (copyFromPackage(file, dest)) {
    logInfo('downloadModels.copy', 'Copied model from package cache', { file });
    return;
  }

  logInfo('downloadModels.download', 'Downloading model', { file, url: `${BASE_URL}/${file}` });
  await download(`${BASE_URL}/${file}`, dest);
}

(async () => {
  for (const file of MODEL_FILES) {
    await syncModelFile(file);
  }
  logInfo('downloadModels.complete', 'Model sync complete');
})().catch((err) => {
  logError('downloadModels', err);
  process.exitCode = 1;
});
