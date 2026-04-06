/**
 * @file features/visual/router.js
 * @description 비주얼 팩토리 모듈의 통합 라우터 (/api/visual/*).
 * @usage server.js에서 /api/visual 경로로 마운트.
 * @connects anchor, derived, lora, image 하위 라우터, services/comfyui/client.js
 * @doc docs/04-visual-factory.md
 */
const express = require('express');
const anchorRouter = require('./anchor/router');
const derivedRouter = require('./derived/router');
const loraRouter = require('./lora/router');
const imageRouter = require('./image/router');
const { comfyui } = require('../../services/comfyui/client');
const { logError } = require('../../app/logger');

const router = express.Router();

router.use('/anchor', anchorRouter);
router.use('/derived', derivedRouter);
router.use('/lora', loraRouter);
router.use('/images', imageRouter);

// GET /api/visual/comfyui/queue
router.get('/comfyui/queue', async (_req, res) => {
  try {
    const [queue, progress] = await Promise.all([comfyui.getQueue(), comfyui.getProgress()]);
    res.json({ queue, progress, ws_connected: comfyui.wsConnected });
  } catch (err) {
    logError('visual.queue', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/visual/comfyui/interrupt
router.post('/comfyui/interrupt', async (_req, res) => {
  try {
    const success = await comfyui.interrupt();
    res.json({ success });
  } catch (err) {
    logError('visual.interrupt', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
