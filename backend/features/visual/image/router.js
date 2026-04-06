/**
 * @file features/visual/image/router.js
 * @description 저장된 이미지 조회 API (/api/visual/images/*).
 * @usage 프론트엔드에서 <img src="/api/visual/images/{id}"> 형태로 호출.
 * @connects storage/oracle/blobStorage.js
 * @doc docs/04-visual-factory.md
 */
const express = require('express');
const { storage } = require('../../../storage/oracle/blobStorage');
const { logError } = require('../../../app/logger');

const router = express.Router();

// GET /api/visual/images/:imageId
router.get('/:imageId(*)', async (req, res) => {
  let imageId = req.params.imageId;

  // 확장자 포함 시 제거 (img_uuid.png → img_uuid)
  if (imageId.includes('.') && !imageId.includes('/') && !imageId.includes('\\')) {
    imageId = imageId.substring(0, imageId.lastIndexOf('.'));
  }

  try {
    let imageBytes = await storage.getImageBytes(imageId);
    let resolvedId = imageId;

    if (!imageBytes) {
      // legacy: 원본 id로 재시도
      imageBytes = await storage.getImageBytes(req.params.imageId);
      resolvedId = req.params.imageId;
      if (!imageBytes) return res.status(404).json({ error: '이미지를 찾을 수 없습니다' });
    }

    const mimeType = await storage.getMimeType(resolvedId);
    res.set('Content-Type', mimeType);
    res.send(imageBytes);
  } catch (err) {
    logError('visual.image', err, { imageId });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
