/**
 * @file features/visual/lora/router.js
 * @description Kohya-ss 기반 LoRA 학습 지원 API.
 */
const express = require('express');
const { prepareTrainingData, startRemoteTraining, stopRemoteTraining, getTrainingStatus, linkManualLora } = require('./service');
const { logError } = require('../../../app/logger');

const router = express.Router();

// POST /api/visual/lora/:assetId/prepare
router.post('/:assetId/prepare', async (req, res) => {
  const { assetId } = req.params;
  const { trigger_word } = req.body;
  try {
    const result = await prepareTrainingData(assetId, trigger_word);
    res.json(result);
  } catch (err) {
    logError('lora.prepare', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/visual/lora/:assetId/train
router.post('/:assetId/train', async (req, res) => {
  const { assetId } = req.params;
  const { trigger_word } = req.body;
  try {
    const result = await startRemoteTraining(assetId, trigger_word);
    res.json(result);
  } catch (err) {
    logError('lora.train', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/visual/lora/:assetId/stop
router.post('/:assetId/stop', async (req, res) => {
  const { assetId } = req.params;
  try {
    const result = await stopRemoteTraining(assetId);
    res.json(result);
  } catch (err) {
    logError('lora.stop', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/visual/lora/:assetId/status
router.get('/:assetId/status', async (req, res) => {
  const { assetId } = req.params;
  try {
    const result = await getTrainingStatus(assetId);
    res.json(result);
  } catch (err) {
    logError('lora.status', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/visual/lora/:assetId/link
router.post('/:assetId/link', async (req, res) => {
  const { assetId } = req.params;
  const { lora_filename, trigger_word } = req.body;
  try {
    const result = await linkManualLora(assetId, lora_filename, trigger_word);
    res.json(result);
  } catch (err) {
    logError('lora.link', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
