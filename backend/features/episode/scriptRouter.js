/**
 * @file features/episode/scriptRouter.js
 * @description 스크립트/사운드/확정 API (script, audio-design, confirm). router.js에서 마운트.
 * @usage features/episode/router.js에서 router.use('/', scriptRouter)로 마운트.
 * @connects app/database.js
 * @doc docs/05-episode.md (대본 저장, 사운드 설계, 에피소드 확정)
 */
const express = require('express');
const { withConnection } = require('../../app/database');
const { logError } = require('../../app/logger');

const router = express.Router();

function readClob(val) {
  if (!val) return '';
  if (typeof val === 'object' && typeof val.getData === 'function') return val.getData();
  return val;
}

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object' && typeof val.getData !== 'function') return val;
  const raw = readClob(val);
  if (typeof raw !== 'string') return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

// PUT /:projectId/episodes/:episodeId/script — 프롬프트 D2 결과(대본) 저장
router.put('/:projectId/episodes/:episodeId/script', async (req, res) => {
  const { episodeId } = req.params;
  const { scriptScenes } = req.body;
  try {
    await withConnection(async (conn) => {
      try {
        await conn.execute(
          'UPDATE episodes SET script_json = :1 WHERE episode_id = :2',
          [JSON.stringify(scriptScenes), episodeId],
          { autoCommit: true }
        );
      } catch (_colErr) {
        logError('episode.script.colMissing', _colErr, { episodeId });
      }
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('episode.script', err, { episodeId });
    res.status(500).json({ error: err.message });
  }
});

// PUT /:projectId/episodes/:episodeId/scenes/:sceneNumber/audio-design
router.put('/:projectId/episodes/:episodeId/scenes/:sceneNumber/audio-design', async (req, res) => {
  const { episodeId, sceneNumber } = req.params;
  const { audioDesign } = req.body;
  try {
    await withConnection(async (conn) => {
      let skelRow;
      try {
        const result = await conn.execute(
          'SELECT skeleton_json FROM episodes WHERE episode_id = :1', [episodeId]
        );
        skelRow = result.rows[0]?.[0];
      } catch (_e) { skelRow = null; }
      const skelParsed = parseJson(skelRow, []);
      const scenes = Array.isArray(skelParsed) ? skelParsed : (skelParsed?.scenes ?? []);
      const updated = scenes.map((s) =>
        s.scene_number === parseInt(sceneNumber, 10) ? { ...s, audio_design: audioDesign } : s
      );
      try {
        await conn.execute(
          'UPDATE episodes SET skeleton_json = :1 WHERE episode_id = :2',
          [JSON.stringify(updated), episodeId], { autoCommit: true }
        );
      } catch (_colErr) {
        logError('episode.audioDesign.colMissing', _colErr, { episodeId, sceneNumber });
      }
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('episode.audioDesign', err, { episodeId, sceneNumber });
    res.status(500).json({ error: err.message });
  }
});

// POST /:projectId/episodes/:episodeId/confirm
router.post('/:projectId/episodes/:episodeId/confirm', async (req, res) => {
  const { projectId, episodeId } = req.params;
  try {
    await withConnection(async (conn) => {
      await conn.execute("UPDATE episodes SET status = 'CONFIRMED' WHERE episode_id = :1", [episodeId]);
      await conn.execute("UPDATE projects SET status = 'EPISODE' WHERE project_id = :1", [projectId]);
      await conn.commit();
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('episode.confirm', err, { projectId, episodeId });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
