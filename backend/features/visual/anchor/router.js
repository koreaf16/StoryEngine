/**
 * @file features/visual/anchor/router.js
 * @description 앵커 이미지 생성 및 확정 API (/api/visual/anchor/*).
 * @usage features/visual/router.js에서 마운트.
 * @connects features/visual/anchor/service.js
 * @doc docs/04-visual-factory.md
 */
const express = require('express');
const multer = require('multer');
const { generateAnchorStream, confirmAnchor, uploadAnchorCandidate, autoGenerateAnchor } = require('./service');
const { comfyui } = require('../../../services/comfyui/client');
const { logError } = require('../../../app/logger');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/visual/anchor/generate  (SSE)
router.post('/generate', async (req, res) => {
  const { project_id, asset_id, asset_type, appearance_prompt, count = 8, visual_style = 'PHOTOREALISTIC' } = req.body;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  try {
    for await (const candidate of generateAnchorStream(project_id, asset_id, asset_type, appearance_prompt, count, visual_style)) {
      res.write(`data: ${JSON.stringify(candidate)}\n\n`);
    }
  } catch (err) {
    logError('anchor.generate', err, { project_id, asset_id, asset_type, count, visual_style });
  }
  res.write('data: {"done": true}\n\n');
  res.end();
});

// POST /api/visual/anchor/generate-pulid  (SSE, multipart)
router.post('/generate-pulid', upload.single('file'), async (req, res) => {
  const { project_id, asset_id, asset_type = 'CHARACTER', appearance_prompt = '', count = 4, weight = 0.85, visual_style = 'PHOTOREALISTIC' } = req.body;
  const imageBuffer = req.file.buffer;

  // ComfyUI에 참조 사진 업로드
  let imageName;
  try {
    const uploadResult = await comfyui.uploadImage(imageBuffer, `ref_${asset_id}.png`);
    imageName = uploadResult.name;
  } catch (err) {
    logError('anchor.generatePulid.upload', err, { project_id, asset_id, asset_type });
    return res.status(500).json({ error: `ComfyUI 업로드 실패: ${err.message}` });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  try {
    for await (const candidate of generateAnchorStream(
      project_id, asset_id, asset_type, appearance_prompt, parseInt(count, 10), visual_style, imageName, parseFloat(weight)
    )) {
      res.write(`data: ${JSON.stringify(candidate)}\n\n`);
    }
  } catch (err) {
    logError('anchor.generatePulid', err, { project_id, asset_id, asset_type, count, visual_style, imageName });
  }
  res.write('data: {"done": true}\n\n');
  res.end();
});

// POST /api/visual/anchor/confirm
router.post('/confirm', async (req, res) => {
  const { project_id, asset_id, candidate_image_id } = req.body;
  try {
    const result = await confirmAnchor(project_id, asset_id, candidate_image_id);
    res.json(result);
  } catch (err) {
    logError('anchor.confirm', err, { project_id, asset_id, candidate_image_id });
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/visual/anchor/auto-generate  (단일 에셋 자동 앵커 생성+확정)
router.post('/auto-generate', async (req, res) => {
  const { project_id, asset_id, asset_type, appearance_prompt, visual_style = 'PHOTOREALISTIC' } = req.body;
  try {
    const result = await autoGenerateAnchor(project_id, asset_id, asset_type, appearance_prompt, visual_style);
    if (!result) return res.status(500).json({ error: '앵커 자동 생성 실패 (최대 시도 초과)' });
    res.json(result);
  } catch (err) {
    logError('anchor.autoGenerate', err, { project_id, asset_id, asset_type });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/visual/anchor/auto-generate-batch  (복수 에셋 일괄 자동 생성)
router.post('/auto-generate-batch', async (req, res) => {
  const { project_id, assets } = req.body;
  // assets: [{ asset_id, asset_type, appearance_prompt, visual_style? }]
  const results = [];
  for (const asset of assets) {
    try {
      const result = await autoGenerateAnchor(
        project_id, asset.asset_id, asset.asset_type, asset.appearance_prompt, asset.visual_style
      );
      results.push({ asset_id: asset.asset_id, success: !!result, ...result });
    } catch (err) {
      logError('anchor.autoGenerateBatch', err, { project_id, asset_id: asset.asset_id });
      results.push({ asset_id: asset.asset_id, success: false, error: err.message });
    }
  }
  res.json({ results });
});

// POST /api/visual/anchor/upload  (multipart)
router.post('/upload', upload.single('file'), async (req, res) => {
  const { project_id, asset_id, index } = req.body;
  try {
    const result = await uploadAnchorCandidate(project_id, asset_id, req.file.buffer, parseInt(index, 10));
    res.json(result);
  } catch (err) {
    logError('anchor.upload', err, { project_id, asset_id, index });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;






