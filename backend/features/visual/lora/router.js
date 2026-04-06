/**
 * @file features/visual/lora/router.js
 * @description LoRA 학습 시작 및 상태 조회 API (/api/visual/lora/*).
 * @usage features/visual/router.js에서 마운트.
 * @connects features/visual/lora/service.js
 * @doc docs/04-visual-factory.md
 */
const express = require('express');
const { startLoraTraining, getLoraStatus, cancelLoraTraining, deleteLoraAsset, mockRegisterLora } = require('./service');
const { logError } = require('../../../app/logger');

const router = express.Router();

// POST /api/visual/lora/train
router.post('/train', async (req, res) => {
  const { project_id, asset_id, asset_name, passed_image_ids } = req.body;
  if (!passed_image_ids || !passed_image_ids.length) {
    return res.status(400).json({ error: '학습에 사용할 이미지가 없습니다' });
  }
  try {
    const result = await startLoraTraining(project_id, asset_id, asset_name, passed_image_ids);
    res.json({
      task_id: result.task_id,
      status: result.status,
      trigger_word: result.triggerWord,
      lora_filename: result.loraFilename,
      training_image_count: result.imageCount,
    });
  } catch (err) {
    logError('lora.train', err, { project_id, asset_id, imageCount: passed_image_ids.length });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/visual/lora/status/:taskId
router.get('/status/:taskId', (req, res) => {
  const status = getLoraStatus(req.params.taskId);
  if (!status) {
    logError('lora.statusMissing', new Error('Task not found'), { taskId: req.params.taskId });
    return res.status(404).json({ error: '작업을 찾을 수 없습니다' });
  }
  res.json(status);
});

// POST /api/visual/lora/mock-register  (개발용: ComfyUI 없이 DB 등록만 테스트)
router.post('/mock-register', async (req, res) => {
  const { project_id, asset_id } = req.body;
  if (!project_id || !asset_id) {
    return res.status(400).json({ error: 'project_id, asset_id 필요' });
  }
  try {
    const result = await mockRegisterLora(project_id, asset_id);
    res.json(result);
  } catch (err) {
    logError('lora.mockRegister', err, { project_id, asset_id });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/visual/lora/cancel/:taskId
router.post('/cancel/:taskId', (req, res) => {
  const result = cancelLoraTraining(req.params.taskId);
  if (!result) {
    return res.status(404).json({ error: '작업을 찾을 수 없습니다' });
  }
  res.json(result);
});

// DELETE /api/visual/lora/:assetId  — LoRA 삭제 + 에셋 상태 초기화
router.delete('/:assetId', async (req, res) => {
  const { assetId } = req.params;
  try {
    const result = await deleteLoraAsset(assetId);
    res.json(result);
  } catch (err) {
    logError('lora.delete', err, { assetId });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

