/**
 * @file features/episode/router.js
 * @description 에피소드, 씬, 샷 CRUD API. 스냅 생성은 snap/router.js 참조.
 * @usage server.js에서 /api/projects 경로로 마운트.
 * @connects app/database.js, features/episode/snap/router.js
 * @doc docs/05-episode.md, docs/06-database.md
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { withConnection } = require('../../app/database');
const { logError } = require('../../app/logger');
const snapRouter = require('./snap/router');
const shotRouter = require('./shotRouter');
const scriptRouter = require('./scriptRouter');

const router = express.Router();

router.use('/:projectId/episodes/:episodeId/snaps', snapRouter);
router.use('/', shotRouter);
router.use('/', scriptRouter);

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

// GET /api/projects/:projectId/episodes
router.get('/:projectId/episodes', async (req, res) => {
  const { projectId } = req.params;
  try {
    const episodes = await withConnection(async (conn) => {
      let epRows, hasSkeletonCol = true;
      try {
        const epResult = await conn.execute(
          'SELECT episode_id, episode_number, status, hint, skeleton_json, novel_text FROM episodes WHERE project_id = :1 ORDER BY episode_number',
          [projectId]
        );
        epRows = epResult.rows.map(([epId, epNum, status, hint, skel, novelText]) => ({ epId, epNum, status, hint, skel, novelText }));
      } catch (_colErr) {
        hasSkeletonCol = false;
        const epResult = await conn.execute(
          'SELECT episode_id, episode_number, status, hint FROM episodes WHERE project_id = :1 ORDER BY episode_number',
          [projectId]
        );
        epRows = epResult.rows.map(([epId, epNum, status, hint]) => ({ epId, epNum, status, hint, skel: null, novelText: null }));
      }
      const eps = [];
      for (const { epId, epNum, status, hint, skel, novelText } of epRows) {
        const hintText = readClob(hint);
        // skeleton_json 컬럼이 없을 경우 hint에 저장된 JSON을 폴백으로 사용
        // skeleton_json 컬럼이 없거나 비어있을 때 hint에 JSON이 저장되어 있으면 폴백 사용
        const skelSource = skel ?? (hintText.trim().startsWith('[') || hintText.trim().startsWith('{') ? hintText : null);
        const skelParsed = parseJson(skelSource, []);
        // episodeApi.saveSkeleton이 { scenes: [...] } 래퍼로 저장하므로 두 포맷 모두 처리
        const skeletonScenes = Array.isArray(skelParsed)
          ? skelParsed
          : (Array.isArray(skelParsed?.scenes) ? skelParsed.scenes : []);
        const skeletonByNum = {};
        for (const sc of skeletonScenes) {
          skeletonByNum[sc.scene_number] = sc;
        }
        const ep = {
          id: epId,
          episode_number: epNum,
          status,
          hint: hasSkeletonCol ? hintText : '',
          novel_text: novelText ? readClob(novelText) : null,
          scenes: [],
        };
        const sResult = await conn.execute(
          `SELECT scene_number, shot_number, render_prompt, camera_motion, duration_sec,
                  transition, snap_image_id, dialogues, bgm_mood, sfx, narrative_note, shot_id, video_prompt
           FROM shots WHERE episode_id = :1 ORDER BY scene_number, shot_number`,
          [epId]
        );
        const scenesMap = {};
        for (const sr of sResult.rows) {
          const [sceneNum, shotNum, renderPrompt, cameraMotion, durationSec,
                 transition, snapImageId, dialogues, bgmMood, sfx, narrativeNote, shotId, videoPrompt] = sr;
          if (!scenesMap[sceneNum]) {
            const meta = skeletonByNum[sceneNum] || {};
            scenesMap[sceneNum] = {
              scene_number: sceneNum,
              title: meta.title || '',
              location_asset: meta.location_asset || null,
              core_event: meta.core_event || '',
              mood: meta.mood || '',
              characters: meta.characters || [],
              shots: [],
            };
          }
          scenesMap[sceneNum].shots.push({
            shot_id: shotId,
            shot_number: shotNum,
            render_prompt: readClob(renderPrompt),
            camera_motion: cameraMotion,
            duration_sec: durationSec,
            transition,
            snap_image_id: snapImageId,
            snap_image: snapImageId ? `/api/visual/images/${snapImageId}` : null,
            dialogues: parseJson(dialogues, []),
            bgm_mood: bgmMood,
            sfx: parseJson(sfx, []),
            narrative_note: readClob(narrativeNote),
            video_prompt: readClob(videoPrompt) || null,
          });
        }
        for (const sc of skeletonScenes) {
          if (!scenesMap[sc.scene_number]) {
            scenesMap[sc.scene_number] = {
              scene_number: sc.scene_number,
              title: sc.title || '',
              location_asset: sc.location_asset || null,
              core_event: sc.core_event || '',
              mood: sc.mood || '',
              characters: sc.characters || [],
              shots: [],
            };
          }
        }
        ep.scenes = Object.values(scenesMap).sort((a, b) => a.scene_number - b.scene_number);
        eps.push(ep);
      }
      return eps;
    });
    res.json(episodes);
  } catch (err) {
    logError('episode.list', err, { projectId });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/episodes
router.post('/:projectId/episodes', async (req, res) => {
  const { projectId } = req.params;
  const { episodeNumber, hint = '' } = req.body;
  const eid = `ep_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
  try {
    await withConnection(async (conn) => {
      await conn.execute(
        'INSERT INTO episodes (episode_id, project_id, episode_number, hint) VALUES (:1, :2, :3, :4)',
        [eid, projectId, episodeNumber, hint],
        { autoCommit: true }
      );
    });
    res.json({ id: eid, episode_number: episodeNumber, status: 'DRAFT', hint });
  } catch (err) {
    logError('episode.create', err, { projectId, episodeNumber, hint });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:projectId/episodes/:episodeId
router.delete('/:projectId/episodes/:episodeId', async (req, res) => {
  const { episodeId } = req.params;
  try {
    await withConnection(async (conn) => {
      await conn.execute('DELETE FROM shots WHERE episode_id = :1', [episodeId]);
      await conn.execute('DELETE FROM episodes WHERE episode_id = :1', [episodeId]);
      await conn.commit();
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('episode.delete', err, { episodeId });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:projectId/episodes/:episodeId/skeleton
router.put('/:projectId/episodes/:episodeId/skeleton', async (req, res) => {
  const { episodeId } = req.params;
  const scenes = req.body;
  try {
    await withConnection(async (conn) => {
      try {
        await conn.execute(
          "UPDATE episodes SET skeleton_json = :1, status = 'SKELETON' WHERE episode_id = :2",
          [JSON.stringify(scenes), episodeId]
        );
      } catch (err) {
        logError('episode.skeleton.primary', err, { episodeId, sceneCount: Array.isArray(scenes) ? scenes.length : null });
        // skeleton_json 컬럼 없을 경우 hint 활용
        await conn.execute(
          "UPDATE episodes SET hint = :1, status = 'SKELETON' WHERE episode_id = :2",
          [JSON.stringify(scenes), episodeId]
        );
      }
      await conn.commit();
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('episode.skeleton', err, { episodeId, sceneCount: Array.isArray(scenes) ? scenes.length : null });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:projectId/episodes/:episodeId/novel
router.put('/:projectId/episodes/:episodeId/novel', async (req, res) => {
  const { episodeId } = req.params;
  const { novelText } = req.body;
  try {
    await withConnection(async (conn) => {
      await conn.execute(
        "UPDATE episodes SET novel_text = :1, status = 'NOVEL' WHERE episode_id = :2",
        [novelText || '', episodeId],
        { autoCommit: true }
      );
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('episode.novel', err, { episodeId });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
