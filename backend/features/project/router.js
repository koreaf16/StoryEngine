/**
 * @file features/project/router.js
 * @description 프로젝트, 스토리 나침반, 에셋, 캐릭터 프로필 CRUD API.
 * @usage server.js에서 /api/projects 경로로 마운트.
 * @connects app/database.js, features/project/derivedImagePayloads.js
 * @doc docs/01-project.md, docs/06-database.md
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { withConnection } = require('../../app/database');
const { buildAssetPayload, attachLoraTrainingSummary, readClob, parseJsonField } = require('./assetPayloads');
const { buildPresetIndex, buildDerivedImagesPayload } = require('./derivedImagePayloads');
const { PRESETS } = require('../visual/derived/presets');
const { logError } = require('../../app/logger');

const router = express.Router();
const DERIVED_PRESET_INDEX = buildPresetIndex(PRESETS);

// GET /api/projects
router.get('/', async (_req, res) => {
  try {
    const projects = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT project_id, title, genre, visual_style, status, created_at,
                (SELECT COUNT(*) FROM assets WHERE project_id = p.project_id AND is_protagonist = 1) as asset_count
         FROM projects p ORDER BY created_at DESC`
      );
      return result.rows.map((row) => ({
        id: row[0],
        title: row[1],
        genre: row[2],
        visual_style: row[3],
        status: row[4],
        created_at: row[5],
        assetCount: row[6],
      }));
    });
    res.json(projects);
  } catch (err) {
    logError('project.list', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  const { title, genre, visual_style } = req.body;
  const projectId = uuidv4();
  try {
    await withConnection(async (conn) => {
      await conn.execute(
        `INSERT INTO projects (project_id, title, genre, visual_style, status)
         VALUES (:1, :2, :3, :4, 'SCRIPT_INPUT')`,
        [projectId, title, genre, visual_style || 'PHOTOREALISTIC'],
        { autoCommit: true }
      );
    });
    res.json({ id: projectId, title, genre, visual_style });
  } catch (err) {
    logError('project.create', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await withConnection(async (conn) => {
      const pResult = await conn.execute(
        'SELECT project_id, title, genre, visual_style, status, seed, world_backbone FROM projects WHERE project_id = :1',
        [projectId]
      );
      if (!pResult.rows.length) return null;

      const [id, title, genre, visual_style, status, seed, worldBackbone] = pResult.rows[0];
      const proj = {
        id,
        title,
        genre,
        visual_style,
        status,
        seed: await readClob(seed) || '',
        worldBackbone: await readClob(worldBackbone) || '',
        storyCompass: null,
        assets: [],
      };

      // Story Compass
      const cResult = await conn.execute(
        `SELECT protagonist_drive, world_rules, possible_directions, tone_keywords, world_backbone
         FROM story_compass WHERE project_id = :1`,
        [projectId]
      );
      if (cResult.rows.length) {
        const [pd, wr, pdir, tk, wb] = cResult.rows[0];
        proj.storyCompass = {
          genre,
          protagonist_drive: pd || null,
          world_rules: wr ? (typeof wr === 'string' ? JSON.parse(wr) : wr) : null,
          possible_directions: pdir ? (typeof pdir === 'string' ? JSON.parse(pdir) : pdir) : null,
          tone_keywords: tk ? (typeof tk === 'string' ? JSON.parse(tk) : tk) : null,
        };
        proj.worldBackbone = wb || '';
      }

      // Assets
      const aResult = await conn.execute(
        `SELECT a.asset_id, a.asset_type, a.display_name, a.appearance_prompt,
                a.visual_strategy, a.audio_type, a.voice_hint, a.pipeline_status,
                p.profile_status, JSON_SERIALIZE(p.personality RETURNING VARCHAR2(32767)), JSON_SERIALIZE(p.speech_style RETURNING VARCHAR2(32767)),
                JSON_SERIALIZE(p.backstory RETURNING VARCHAR2(32767)), JSON_SERIALIZE(p.behavioral_rules RETURNING VARCHAR2(32767)),
                a.anchor_image_id, JSON_SERIALIZE(a.anchor_embedding RETURNING VARCHAR2(32767)), a.trigger_word, a.lora_path, sf.file_name,
                a.outfit_prompt, a.outfit_anchor_id, NVL(a.is_protagonist, 0)
         FROM assets a
         LEFT JOIN character_profiles p ON a.asset_id = p.asset_id
         LEFT JOIN system_files sf ON a.lora_path = sf.file_id
         WHERE a.project_id = :1
         ORDER BY a.created_at ASC`,
        [projectId]
      );
      for (const row of aResult.rows) {
        const asset = buildAssetPayload(row);

        const dResult = await conn.execute(
          `SELECT d.image_id, d.preset_name, d.face_distance, d.is_passed
           FROM asset_derived_images d
           JOIN system_files f ON d.image_id = f.file_id
           WHERE f.asset_id = :1`,
          [asset.asset_id]
        );
        asset.derived_images = buildDerivedImagesPayload(
          dResult.rows,
          asset.asset_type,
          asset.pipeline_status,
          DERIVED_PRESET_INDEX
        );
        
        proj.assets.push(attachLoraTrainingSummary(asset));
      }
      return proj;
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    logError('project.get', err, { projectId });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { mood, status, seed, worldBackbone } = req.body;
  try {
    await withConnection(async (conn) => {
      if (mood !== undefined) {
        await conn.execute(
          'UPDATE projects SET genre = :1 WHERE project_id = :2',
          [mood, projectId]
        );
      }
      if (status !== undefined) {
        await conn.execute(
          'UPDATE projects SET status = :1 WHERE project_id = :2',
          [status, projectId]
        );
      }
      if (seed !== undefined) {
        await conn.execute(
          'UPDATE projects SET seed = :1 WHERE project_id = :2',
          [seed, projectId]
        );
      }
      if (worldBackbone !== undefined) {
        await conn.execute(
          'UPDATE projects SET world_backbone = :1 WHERE project_id = :2',
          [worldBackbone, projectId]
        );
      }
      await conn.commit();
    });
    res.json({ success: true });
  } catch (err) {
    logError('project.update', err, { projectId });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    await withConnection(async (conn) => {
      await conn.execute('DELETE FROM projects WHERE project_id = :1', [projectId]);
      await conn.commit();
    });
    res.json({ success: true });
  } catch (err) {
    logError('project.delete', err, { projectId });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
