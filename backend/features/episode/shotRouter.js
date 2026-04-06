/**
 * @file features/episode/shotRouter.js
 * @description 샷 CRUD API (씬별 샷, 배치 업데이트, PATCH, DELETE). router.js에서 마운트.
 * @usage features/episode/router.js에서 router.use('/', shotRouter)로 마운트.
 * @connects app/database.js
 * @doc docs/05-episode.md (샷 생성/수정/삭제)
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { withConnection } = require('../../app/database');
const { logError } = require('../../app/logger');

const router = express.Router();

// PUT /:projectId/episodes/:episodeId/shots/batch — Chain 2/4/5 씬+샷 일괄 저장
router.put('/:projectId/episodes/:episodeId/shots/batch', async (req, res) => {
  const { episodeId } = req.params;
  const { scenes } = req.body;
  if (!Array.isArray(scenes)) return res.status(400).json({ error: 'scenes must be an array' });
  try {
    await withConnection(async (conn) => {
      await conn.execute('DELETE FROM shots WHERE episode_id = :1', [episodeId]);
      for (const sc of scenes) {
        const scNum = parseInt(sc.scene_number, 10);
        for (const s of (sc.shots || [])) {
          const sid = `shot_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
          await conn.execute(
            `INSERT INTO shots (shot_id, episode_id, scene_number, shot_number, render_prompt,
             camera_motion, duration_sec, transition, dialogues, bgm_mood, sfx, narrative_note,
             snap_image_id, video_prompt)
             VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14)`,
            [
              sid, episodeId, scNum, s.shot_number, s.render_prompt || '',
              s.camera_motion || 'Static', s.duration_sec || 4.0, s.transition || 'cut',
              JSON.stringify(s.dialogues || []), s.bgm_mood || '',
              JSON.stringify(s.sfx || []), s.narrative_note || '',
              s.snap_image_id || null, s.video_prompt || null,
            ]
          );
        }
      }
      const skelJson = JSON.stringify(scenes.map((sc) => ({
        scene_number: sc.scene_number, title: sc.title,
        location_asset: sc.location_asset, characters: sc.characters,
        core_event: sc.core_event, mood: sc.mood,
        tension_level: sc.tension_level, color_palette: sc.color_palette,
        key_object: sc.key_object, connection_device: sc.connection_device,
      })));
      await conn.execute(
        "UPDATE episodes SET skeleton_json = :1, status = 'CHAIN_DESIGN' WHERE episode_id = :2",
        [skelJson, episodeId]
      );
      await conn.commit();
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('episode.shots.batch', err, { episodeId });
    res.status(500).json({ error: err.message });
  }
});

// PUT /:projectId/episodes/:episodeId/scenes/:sceneNumber/shots
router.put('/:projectId/episodes/:episodeId/scenes/:sceneNumber/shots', async (req, res) => {
  const { episodeId, sceneNumber } = req.params;
  const { shots } = req.body;
  try {
    await withConnection(async (conn) => {
      await conn.execute(
        'DELETE FROM shots WHERE episode_id = :1 AND scene_number = :2',
        [episodeId, parseInt(sceneNumber, 10)]
      );
      for (const s of shots) {
        const sid = `shot_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
        await conn.execute(
          `INSERT INTO shots (shot_id, episode_id, scene_number, shot_number, render_prompt,
           camera_motion, duration_sec, transition, dialogues, bgm_mood, sfx, narrative_note, snap_image_id)
           VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13)`,
          [
            sid, episodeId, parseInt(sceneNumber, 10), s.shot_number, s.render_prompt,
            s.camera_motion || 'Static', s.duration_sec || 5.0, s.transition || 'cut',
            JSON.stringify(s.dialogues || []), s.bgm_mood || '',
            JSON.stringify(s.sfx || []), s.narrative_note || '', s.snap_image_id || null,
          ]
        );
      }
      await conn.commit();
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('episode.shots.update', err, { episodeId, sceneNumber });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:projectId/episodes/:episodeId/scenes/:sceneNumber/shots/:shotNumber
router.patch('/:projectId/episodes/:episodeId/scenes/:sceneNumber/shots/:shotNumber', async (req, res) => {
  const { episodeId, sceneNumber, shotNumber } = req.params;
  const updates = req.body;
  try {
    await withConnection(async (conn) => {
      const fields = [];
      const values = [];
      const addField = (col, val) => { fields.push(`${col} = :${values.length + 1}`); values.push(val); };
      if (updates.render_prompt !== undefined) addField('render_prompt', updates.render_prompt);
      if (updates.camera_motion !== undefined) addField('camera_motion', updates.camera_motion);
      if (updates.duration_sec !== undefined) addField('duration_sec', updates.duration_sec);
      if (updates.transition !== undefined) addField('transition', updates.transition);
      if (updates.dialogues !== undefined) addField('dialogues', JSON.stringify(updates.dialogues));
      if (updates.bgm_mood !== undefined) addField('bgm_mood', updates.bgm_mood);
      if (updates.sfx !== undefined) addField('sfx', JSON.stringify(updates.sfx));
      if (updates.narrative_note !== undefined) addField('narrative_note', updates.narrative_note);
      if (updates.video_prompt !== undefined) addField('video_prompt', updates.video_prompt);
      if (!fields.length) return;
      values.push(episodeId, parseInt(sceneNumber, 10), parseInt(shotNumber, 10));
      await conn.execute(
        `UPDATE shots SET ${fields.join(', ')} WHERE episode_id = :${values.length - 2} AND scene_number = :${values.length - 1} AND shot_number = :${values.length}`,
        values, { autoCommit: true }
      );
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('episode.shots.patch', err, { episodeId, sceneNumber, shotNumber });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:projectId/episodes/:episodeId/scenes/:sceneNumber/shots/:shotNumber
router.delete('/:projectId/episodes/:episodeId/scenes/:sceneNumber/shots/:shotNumber', async (req, res) => {
  const { episodeId, sceneNumber, shotNumber } = req.params;
  try {
    await withConnection(async (conn) => {
      await conn.execute(
        'DELETE FROM shots WHERE episode_id = :1 AND scene_number = :2 AND shot_number = :3',
        [episodeId, parseInt(sceneNumber, 10), parseInt(shotNumber, 10)],
        { autoCommit: true }
      );
    });
    res.status(204).send();
  } catch (err) {
    logError('episode.shots.delete', err, { episodeId, sceneNumber, shotNumber });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
