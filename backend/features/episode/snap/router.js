/**
 * @file features/episode/snap/router.js
 * @description 스냅 이미지 생성 API. 배치(SSE)와 단일 샷 생성 엔드포인트.
 * @usage features/episode/router.js에서 /:projectId/episodes/:episodeId/snaps 경로로 마운트.
 * @connects features/episode/snap/service.js
 * @doc docs/05-episode.md (5. 스냅 이미지 생성)
 */
const express = require('express');
const { generateSnap, generateSnapsStream } = require('./service');
const { logError } = require('../../../app/logger');

const router = express.Router({ mergeParams: true });

// POST /api/projects/:projectId/episodes/:episodeId/snaps/generate  (SSE)
// snap_image_id가 없는 샷(또는 force=true일 경우 전체)을 순서대로 생성하며 진행 상황을 스트리밍한다.
router.post('/generate', async (req, res) => {
  const { projectId, episodeId } = req.params;
  const { force } = req.body || {};

  console.log(`\x1b[33m[SnapRouter]\x1b[0m Incoming generation request: project=${projectId}, ep=${episodeId}, force=${force}`);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  try {
    for await (const event of generateSnapsStream(projectId, episodeId, force === true)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (err) {
    console.error(`\x1b[31m[SnapRouter]\x1b[0m Stream error:`, err);
    logError('snap.generate', err, { projectId, episodeId });
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
  }
  res.write('data: {"done": true}\n\n');
  res.end();
});

// POST /api/projects/:projectId/episodes/:episodeId/snaps/:sceneNumber/:shotNumber
// 단일 샷의 스냅을 생성(또는 재생성)한다.
router.post('/:sceneNumber/:shotNumber', async (req, res) => {
  const { projectId, episodeId, sceneNumber, shotNumber } = req.params;
  console.log(`\x1b[33m[SnapRouter]\x1b[0m Single snap request: scene=${sceneNumber}, shot=${shotNumber}`);
  try {
    const result = await generateSnap(projectId, episodeId, sceneNumber, shotNumber);
    res.json(result);
  } catch (err) {
    console.error(`\x1b[31m[SnapRouter]\x1b[0m Single snap error:`, err);
    logError('snap.regenerate', err, { projectId, episodeId, sceneNumber, shotNumber });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
