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
const { getTaskByAssetId } = require('../visual/lora/service');
const { logError } = require('../../app/logger');

const router = express.Router();
const DERIVED_PRESET_INDEX = buildPresetIndex(PRESETS);

// GET /api/projects
router.get('/', async (_req, res) => {
  try {
    const rows = await withConnection(async (conn) => {
      const result = await conn.execute(
        'SELECT project_id, title, genre, mood, status, updated_at, visual_style FROM projects'
      );
      return result.rows;
    });
    res.json(rows.map(([id, title, genre, mood, status, updatedAt, visual_style]) => ({
      id, title, genre, mood, status, updatedAt, visual_style: visual_style || 'PHOTOREALISTIC',
    })));
  } catch (err) {
    logError('project.list', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  const { title, genre, visual_style } = req.body;
  const pid = `p_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
  const vs = visual_style || 'PHOTOREALISTIC';
  try {
    await withConnection(async (conn) => {
      await conn.execute(
        "INSERT INTO projects (project_id, title, genre, visual_style, status) VALUES (:1, :2, :3, :4, 'SCRIPT_INPUT')",
        [pid, title, genre, vs],
        { autoCommit: true }
      );
    });
    res.json({ id: pid, title, genre, visual_style: vs, status: 'SCRIPT_INPUT' });
  } catch (err) {
    logError('project.create', err, { title, genre, visual_style: vs });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await withConnection(async (conn) => {
      const pResult = await conn.execute(
        'SELECT title, genre, mood, status, seed, visual_style FROM projects WHERE project_id = :1',
        [projectId]
      );
      if (!pResult.rows.length) return null;
      const [title, genre, mood, status, seed, visual_style] = pResult.rows[0];

      const proj = { id: projectId, title, genre, mood, status, seed: seed || '', visual_style: visual_style || 'PHOTOREALISTIC', assets: [], storyCompass: null, worldBackbone: '' };

      // Story Compass
      const cResult = await conn.execute(
        `SELECT
          protagonist_drive,
          JSON_SERIALIZE(world_rules RETURNING VARCHAR2(32767)) as world_rules,
          JSON_SERIALIZE(possible_directions RETURNING VARCHAR2(32767)) as possible_directions,
          JSON_SERIALIZE(tone_keywords RETURNING VARCHAR2(32767)) as tone_keywords,
          world_backbone
         FROM story_compass WHERE project_id = :1`,
        [projectId]
      );
      if (cResult.rows.length) {
        const [pd, wr, pdir, tk, wb] = cResult.rows[0];
        proj.storyCompass = {
          genre,
          mood,
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
        
        // 현재 진행 중인 LoRA 태스크가 있다면 추가
        asset.lora_task = getTaskByAssetId(asset.asset_id);
        
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
        await conn.execute('UPDATE projects SET mood = :1 WHERE project_id = :2', [mood, projectId]);
      }
      if (status !== undefined) {
        await conn.execute('UPDATE projects SET status = :1 WHERE project_id = :2', [status, projectId]);
      }
      if (seed !== undefined) {
        await conn.execute('UPDATE projects SET seed = :1 WHERE project_id = :2', [seed, projectId]);
      }
      if (worldBackbone !== undefined) {
        const exists = await conn.execute('SELECT 1 FROM story_compass WHERE project_id = :1', [projectId]);
        if (exists.rows.length) {
          await conn.execute('UPDATE story_compass SET world_backbone = :1 WHERE project_id = :2', [worldBackbone, projectId]);
        } else {
          await conn.execute('INSERT INTO story_compass (project_id, world_backbone) VALUES (:1, :2)', [projectId, worldBackbone]);
        }
      }
      await conn.commit();
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('project.update', err, { projectId, body: req.body });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  try {
    await withConnection(async (conn) => {
      const check = await conn.execute('SELECT 1 FROM projects WHERE project_id = :1', [projectId]);
      if (!check.rows.length) throw Object.assign(new Error('Project not found'), { status: 404 });
      await conn.execute('DELETE FROM projects WHERE project_id = :1', [projectId], { autoCommit: true });
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('project.delete', err, { projectId });
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/projects/:id/compass
router.put('/:projectId/compass', async (req, res) => {
  const { projectId } = req.params;
  const { genre, mood, protagonist_drive, world_rules, possible_directions, tone_keywords, world_backbone } = req.body;
  try {
    await withConnection(async (conn) => {
      const exists = await conn.execute('SELECT 1 FROM story_compass WHERE project_id = :1', [projectId]);
      const rules = JSON.stringify(world_rules);
      const dirs = JSON.stringify(possible_directions);
      const tones = JSON.stringify(tone_keywords);
      if (exists.rows.length) {
        await conn.execute(
          `UPDATE story_compass SET genre = :1, mood = :2, protagonist_drive = :3,
           world_rules = :4, possible_directions = :5, tone_keywords = :6, world_backbone = :7
           WHERE project_id = :8`,
          [genre, mood, protagonist_drive, rules, dirs, tones, world_backbone, projectId]
        );
      } else {
        await conn.execute(
          `INSERT INTO story_compass (project_id, genre, mood, protagonist_drive, world_rules, possible_directions, tone_keywords, world_backbone)
           VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`,
          [projectId, genre, mood, protagonist_drive, rules, dirs, tones, world_backbone]
        );
      }
      await conn.commit();
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('project.compass', err, { projectId, body: req.body });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id/assets
router.put('/:projectId/assets', async (req, res) => {
  const { projectId } = req.params;
  const assets = req.body;
  try {
    await withConnection(async (conn) => {
      const existing = await conn.execute('SELECT asset_id FROM assets WHERE project_id = :1', [projectId]);
      const existingIds = new Set(existing.rows.map((r) => r[0]));
      const newIds = new Set(assets.map((a) => a.asset_id));

      for (const aid of existingIds) {
        if (!newIds.has(aid)) {
          await conn.execute('DELETE FROM assets WHERE asset_id = :1', [aid]);
        }
      }

      for (const a of assets) {
        const isProtagonist = a.is_protagonist ? 1 : 0;
        if (existingIds.has(a.asset_id)) {
          await conn.execute(
            `UPDATE assets SET asset_type = :1, display_name = :2, appearance_prompt = :3,
             visual_strategy = :4, audio_type = :5, voice_hint = :6, pipeline_status = :7,
             anchor_image_id = :8, anchor_embedding = :9, trigger_word = :10, lora_path = :11,
             outfit_prompt = :12, outfit_anchor_id = :13, is_protagonist = :14
             WHERE asset_id = :15`,
            [a.asset_type, a.display_name, a.appearance_prompt,
             a.visual_strategy, a.audio_type, a.voice_hint, a.pipeline_status,
             a.anchor_image_id || null,
             a.anchor_embedding ? (typeof a.anchor_embedding === 'string' ? a.anchor_embedding : JSON.stringify(a.anchor_embedding)) : null,
             a.trigger_word || null, a.lora_path || null,
             a.outfit_prompt || null, a.outfit_anchor_id || null,
             isProtagonist, a.asset_id]
          );
        } else {
          await conn.execute(
            `INSERT INTO assets (asset_id, project_id, asset_type, display_name, appearance_prompt,
             visual_strategy, audio_type, voice_hint, pipeline_status, anchor_image_id, anchor_embedding,
             trigger_word, lora_path, outfit_prompt, outfit_anchor_id, is_protagonist)
             VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, :16)`,
            [a.asset_id, projectId, a.asset_type, a.display_name, a.appearance_prompt,
             a.visual_strategy || 'PROMPT', a.audio_type || 'NONE', a.voice_hint || '',
             a.pipeline_status || 'NONE', a.anchor_image_id || null,
             a.anchor_embedding ? (typeof a.anchor_embedding === 'string' ? a.anchor_embedding : JSON.stringify(a.anchor_embedding)) : null,
             a.trigger_word || null, a.lora_path || null,
             a.outfit_prompt || null, a.outfit_anchor_id || null, isProtagonist]
          );
        }
      }
      await conn.commit();
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('project.assets', err, { projectId, assetCount: assets.length });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:id/assets/:assetId/profile
router.put('/:projectId/assets/:assetId/profile', async (req, res) => {
  const { assetId } = req.params;
  const { profile_status, personality, speech_style, backstory, behavioral_rules } = req.body;
  try {
    await withConnection(async (conn) => {
      const exists = await conn.execute('SELECT 1 FROM character_profiles WHERE asset_id = :1', [assetId]);
      const p = personality ? JSON.stringify(personality) : null;
      const s = speech_style ? JSON.stringify(speech_style) : null;
      const b = backstory ? JSON.stringify(backstory) : null;
      const r = behavioral_rules ? JSON.stringify(behavioral_rules) : null;

      if (exists.rows.length) {
        await conn.execute(
          `UPDATE character_profiles SET profile_status = :1, personality = :2, speech_style = :3,
           backstory = :4, behavioral_rules = :5 WHERE asset_id = :6`,
          [profile_status, p, s, b, r, assetId]
        );
      } else {
        await conn.execute(
          `INSERT INTO character_profiles (asset_id, profile_status, personality, speech_style, backstory, behavioral_rules)
           VALUES (:1, :2, :3, :4, :5, :6)`,
          [assetId, profile_status, p, s, b, r]
        );
      }
      await conn.commit();
    });
    res.json({ status: 'ok' });
  } catch (err) {
    logError('project.profile', err, { assetId });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
