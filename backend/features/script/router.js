/**
 * @file features/script/router.js
 * @description Prompt A/B 원문 스냅샷 조회 및 저장 API.
 * @usage server.js에서 /api/projects 경로로 마운트.
 * @connects app/database.js, script_stage_snapshots 테이블
 * @doc docs/02-script-input.md, docs/06-database.md
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { withConnection } = require('../../app/database');
const { logError } = require('../../app/logger');

const router = express.Router();
const ALLOWED_STAGE_KEYS = new Set(['PROMPT_A', 'PROMPT_B']);

function validateStageKey(stageKey) {
  return ALLOWED_STAGE_KEYS.has(stageKey);
}

function parseStoredJson(value) {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    logError('script.parseStoredJson', err, { preview: typeof value === 'string' ? value.slice(0, 200) : null });
    return value;
  }
}

function serializeParsedJson(value) {
  if (value === undefined || value === null || value === '') return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

async function projectExists(conn, projectId) {
  const result = await conn.execute(
    'SELECT 1 FROM projects WHERE project_id = :1',
    [projectId]
  );
  return result.rows.length > 0;
}

// GET /api/projects/:projectId/script-stages/:stageKey
router.get('/:projectId/script-stages/:stageKey', async (req, res) => {
  const { projectId, stageKey } = req.params;
  if (!validateStageKey(stageKey)) {
    return res.status(400).json({ error: 'Invalid stage key' });
  }

  try {
    const snapshot = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT snapshot_id,
                DBMS_LOB.SUBSTR(prompt_text, 32767, 1) AS prompt_text,
                DBMS_LOB.SUBSTR(response_text, 32767, 1) AS response_text,
                DBMS_LOB.SUBSTR(parsed_json, 32767, 1) AS parsed_json,
                DBMS_LOB.SUBSTR(parse_error, 32767, 1) AS parse_error,
                created_at,
                updated_at
           FROM script_stage_snapshots
          WHERE project_id = :1 AND stage_key = :2
          ORDER BY updated_at DESC, created_at DESC`,
        [projectId, stageKey]
      );
      if (!result.rows.length) return null;

      const [snapshotId, promptText, responseText, parsedJson, parseError, createdAt, updatedAt] = result.rows[0];
      return {
        id: snapshotId,
        projectId,
        stageKey,
        promptText: promptText || '',
        responseText: responseText || '',
        parsedJson: parseStoredJson(parsedJson),
        parseError: parseError || '',
        createdAt,
        updatedAt,
      };
    });

    if (!snapshot) {
      return res.status(404).json({ error: 'Script stage snapshot not found' });
    }
    res.json(snapshot);
  } catch (err) {
    logError('script.getStage', err, { projectId, stageKey });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/projects/:projectId/script-stages/:stageKey
router.put('/:projectId/script-stages/:stageKey', async (req, res) => {
  const { projectId, stageKey } = req.params;
  const {
    promptText = '',
    responseText = '',
    parsedJson = null,
    parseError = '',
  } = req.body;

  if (!validateStageKey(stageKey)) {
    return res.status(400).json({ error: 'Invalid stage key' });
  }

  try {
    const payload = await withConnection(async (conn) => {
      if (!(await projectExists(conn, projectId))) {
        throw Object.assign(new Error('Project not found'), { status: 404 });
      }

      const existing = await conn.execute(
        `SELECT snapshot_id
           FROM script_stage_snapshots
          WHERE project_id = :1 AND stage_key = :2
          ORDER BY updated_at DESC, created_at DESC`,
        [projectId, stageKey]
      );

      const parsedJsonText = serializeParsedJson(parsedJson);
      let snapshotId = existing.rows[0]?.[0] || null;

      if (snapshotId) {
        await conn.execute(
          `UPDATE script_stage_snapshots
              SET prompt_text = :1,
                  response_text = :2,
                  parsed_json = :3,
                  parse_error = :4,
                  updated_at = SYSTIMESTAMP
            WHERE snapshot_id = :5`,
          [promptText, responseText, parsedJsonText, parseError, snapshotId]
        );
      } else {
        snapshotId = `snap_${uuidv4().replace(/-/g, '').slice(0, 8)}`;
        await conn.execute(
          `INSERT INTO script_stage_snapshots (
             snapshot_id, project_id, stage_key, prompt_text, response_text,
             parsed_json, parse_error, created_at, updated_at
           ) VALUES (:1, :2, :3, :4, :5, :6, :7, SYSTIMESTAMP, SYSTIMESTAMP)`,
          [snapshotId, projectId, stageKey, promptText, responseText, parsedJsonText, parseError]
        );
      }

      await conn.commit();

      return {
        id: snapshotId,
        projectId,
        stageKey,
        promptText,
        responseText,
        parsedJson: parsedJson === '' ? null : parsedJson,
        parseError,
      };
    });

    res.json(payload);
  } catch (err) {
    logError('script.saveStage', err, { projectId, stageKey, body: req.body });
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
