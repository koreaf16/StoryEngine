/**
 * @file features/visual/derived/router.js
 * @description 파생 이미지 생성 및 얼굴 필터링 API (/api/visual/derived/*).
 * @usage features/visual/router.js에서 마운트.
 * @connects features/visual/derived/service.js, features/visual/derived/presets.js
 * @doc docs/04-visual-factory.md
 */
const express = require('express');
const { generateDerivedStream, filterDerivedImages } = require('./service');
const { PRESETS } = require('./presets');
const { logError } = require('../../../app/logger');

const router = express.Router();

// POST /api/visual/derived/generate  (SSE)
router.post('/generate', async (req, res) => {
  const { project_id, asset_id, asset_type, anchor_image_id, appearance_prompt, outfit_prompt, target_presets } = req.body;

  let presets = PRESETS[asset_type] || PRESETS.CHARACTER;
  if (target_presets && target_presets.length) {
    presets = presets.filter((p) => target_presets.includes(p.key));
  }
  const total = presets.length;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ started: true, total })}\n\n`);

  try {
    for await (const image of generateDerivedStream(
      project_id, asset_id, asset_type, anchor_image_id, appearance_prompt, target_presets, outfit_prompt
    )) {
      res.write(`data: ${JSON.stringify(image)}\n\n`);
    }
  } catch (err) {
    logError('derived.generate', err, { project_id, asset_id, asset_type, anchor_image_id });
  }

  res.write('data: {"done": true}\n\n');
  res.end();
});

// POST /api/visual/derived/filter
router.post('/filter', async (req, res) => {
  const { asset_type, anchor_embedding, images, face_threshold } = req.body;
  try {
    const filtered = await filterDerivedImages(asset_type, anchor_embedding, images, face_threshold);
    const passed = filtered.filter((f) => f.filter_result === 'PASS').length;
    const failed = filtered.filter((f) => f.filter_result === 'FAIL').length;
    const skipped = filtered.filter((f) => f.filter_result === 'SKIP').length;
    res.json({ passed_count: passed, failed_count: failed, skipped_count: skipped, images: filtered });
  } catch (err) {
    logError('derived.filter', err, { asset_type, imageCount: Array.isArray(images) ? images.length : 0 });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
