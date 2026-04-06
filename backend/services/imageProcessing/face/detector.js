/**
 * @file services/imageProcessing/face/detector.js
 * @description 얼굴 감지 및 바운딩박스 추출. @vladmandic/face-api 기반.
 * @usage services/imageProcessing/scorer.js, embedder.js에서 사용.
 * @connects @vladmandic/face-api, canvas
 * @doc docs/04-visual-factory.md
 */
const fs = require('fs');
const path = require('path');
const { logError, logWarn } = require('../../../app/logger');

let faceapi = null;
let canvas = null;
let modelsLoaded = false;
let initPromise = null;
let faceProcessingDisabled = false;

const MODELS_DIR = path.join(__dirname, '../../../models');
const MODEL_FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model.bin',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model.bin',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model.bin',
];
const MIN_MODEL_FILE_SIZE = 1024;

function ensureWindowsTensorflowDllPath() {
  if (process.platform !== 'win32') return;

  const tfjsNodePackageJson = require.resolve('@tensorflow/tfjs-node/package.json');
  const tfjsNodeDir = path.dirname(tfjsNodePackageJson);
  const tensorflowLibDir = path.join(tfjsNodeDir, 'deps', 'lib');
  const currentPath = process.env.PATH || '';
  const segments = currentPath.split(path.delimiter).filter(Boolean);

  if (!segments.some((segment) => path.resolve(segment) === path.resolve(tensorflowLibDir))) {
    process.env.PATH = [tensorflowLibDir, ...segments].join(path.delimiter);
  }
}

function getBundledModelDir() {
  try {
    const faceApiPackageJson = require.resolve('@vladmandic/face-api/package.json');
    return path.join(path.dirname(faceApiPackageJson), 'model');
  } catch (err) {
    logWarn('face.bundledModelDir', 'Bundled face-api model directory not found', { error: err.message });
    return null;
  }
}

function hasUsableModelFiles(modelDir) {
  if (!modelDir) return false;

  return MODEL_FILES.every((filename) => {
    try {
      const filePath = path.join(modelDir, filename);
      const stats = fs.statSync(filePath);
      return stats.isFile() && stats.size > MIN_MODEL_FILE_SIZE;
    } catch (err) {
      logWarn('face.modelFile', 'Face model file is missing or unusable', { modelDir, filename, error: err.message });
      return false;
    }
  });
}

function resolveFaceModelDir() {
  if (hasUsableModelFiles(MODELS_DIR)) return MODELS_DIR;

  const bundledModelDir = getBundledModelDir();
  if (hasUsableModelFiles(bundledModelDir)) {
    return bundledModelDir;
  }

  return MODELS_DIR;
}

function loadTensorflowRuntime() {
  ensureWindowsTensorflowDllPath();

  try {
    return require('@tensorflow/tfjs-node');
  } catch (err) {
    logWarn('face.tfjsNode', 'Falling back to pure JS TensorFlow runtime', { error: err.message });
    return require('@tensorflow/tfjs');
  }
}

async function initializeFaceModels() {
  if (modelsLoaded) return true;
  if (faceProcessingDisabled) return false;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const tf = loadTensorflowRuntime();
      const faceapiModule = require('@vladmandic/face-api');
      const canvasModule = require('canvas');
      const modelDir = resolveFaceModelDir();

      faceapi = faceapiModule;
      canvas = canvasModule;

      const { Canvas, Image, ImageData } = canvasModule;
      faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

      if (tf && typeof tf.ready === 'function') {
        await tf.ready();
      }

      if (modelDir !== MODELS_DIR) {
        logWarn('face.models', 'Using bundled face-api models', { modelDir });
      }

      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelDir);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelDir);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelDir);

      modelsLoaded = true;
      faceProcessingDisabled = false;
      return true;
    } catch (err) {
      faceProcessingDisabled = true;
      logWarn('face.disabled', 'Face processing disabled', { error: err.message });
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

async function loadFaceModels() {
  return initializeFaceModels();
  if (modelsLoaded) return;

  // TensorFlow.js Node 백엔드 등록
  require('@tensorflow/tfjs-node');
  const faceapiModule = require('@vladmandic/face-api');
  const canvasModule = require('canvas');

  faceapi = faceapiModule;
  canvas = canvasModule;

  // face-api에 canvas 주입
  const { Canvas, Image, ImageData } = canvasModule;
  faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR);

  modelsLoaded = true;
}

/**
 * 이미지에서 모든 얼굴 위치 반환.
 * @returns {Array<{x, y, width, height}>}
 */
async function getFaceLocations(imagePath) {
  if (!(await loadFaceModels())) return [];
  const img = await canvas.loadImage(imagePath);
  const detections = await faceapi.detectAllFaces(img);
  return detections.map((d) => d.box);
}

/**
 * 이미지에 얼굴이 있는지 여부.
 */
async function hasFace(imagePath) {
  const locations = await getFaceLocations(imagePath);
  return locations.length > 0;
}

/**
 * 가장 큰 얼굴의 바운딩박스 반환.
 * @returns {{x, y, width, height} | null}
 */
async function getPrimaryFaceBbox(imagePath) {
  const locations = await getFaceLocations(imagePath);
  if (!locations.length) return null;
  return locations.reduce((largest, loc) =>
    loc.width * loc.height > largest.width * largest.height ? loc : largest
  );
}

module.exports = { loadFaceModels, getFaceLocations, hasFace, getPrimaryFaceBbox };

