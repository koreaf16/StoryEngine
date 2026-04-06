/**
 * @file features/memory/router.js
 * @description 프로젝트 메모리 시스템 API. 씬 벡터, 그래프 노드/에지 CRUD.
 * @usage server.js에서 /api/projects에 마운트. 에피소드 확정 시 저장, 소설 생성 시 조회.
 * @connects app/database.js, features/episode/router.js
 * @doc docs/05-episode.md
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { withConnection } = require('../../app/database');
const { logError } = require('../../app/logger');

const router = express.Router();

// ─── 씬 벡터 ─────────────────────────────────────────────

// POST /:projectId/vectors — 씬 요약 저장
router.post('/:projectId/vectors', async (req, res) => {
  const { projectId } = req.params;
  const { episodeId, sceneNumber, summaryText, embedding } = req.body;
  if (!summaryText) return res.status(400).json({ error: 'summaryText required' });

  try {
    const vectorId = `vec_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    await withConnection(async (conn) => {
      await conn.execute(
        `INSERT INTO scene_vectors (vector_id, project_id, episode_id, scene_number, summary_text, embedding)
         VALUES (:1, :2, :3, :4, :5, :6)`,
        [vectorId, projectId, episodeId || null, sceneNumber || null, summaryText, embedding ? JSON.stringify(embedding) : null]
      );
      await conn.commit();
    });
    res.json({ vectorId });
  } catch (err) {
    logError('memory.saveVector', err, { projectId });
    res.status(500).json({ error: err.message });
  }
});

// GET /:projectId/vectors — 프로젝트 전체 벡터 조회 (최신 50개)
router.get('/:projectId/vectors', async (req, res) => {
  const { projectId } = req.params;
  try {
    let rows;
    await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT vector_id, episode_id, scene_number, summary_text, created_at
         FROM scene_vectors WHERE project_id = :1
         ORDER BY created_at DESC FETCH FIRST 50 ROWS ONLY`,
        [projectId]
      );
      rows = result.rows.map(([vectorId, episodeId, sceneNumber, summaryText, createdAt]) => ({
        vectorId, episodeId, sceneNumber, summaryText, createdAt,
      }));
    });
    res.json(rows);
  } catch (err) {
    logError('memory.getVectors', err, { projectId });
    res.status(500).json({ error: err.message });
  }
});

// ─── 그래프 노드/에지 ──────────────────────────────────────

// POST /:projectId/graph/nodes — 노드 생성
router.post('/:projectId/graph/nodes', async (req, res) => {
  const { projectId } = req.params;
  const { episodeId, nodeType, label, properties } = req.body;
  if (!label) return res.status(400).json({ error: 'label required' });

  try {
    const nodeId = `node_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    await withConnection(async (conn) => {
      await conn.execute(
        `INSERT INTO story_nodes (node_id, project_id, episode_id, node_type, label, properties)
         VALUES (:1, :2, :3, :4, :5, :6)`,
        [nodeId, projectId, episodeId || null, nodeType || 'EVENT', label, properties ? JSON.stringify(properties) : null]
      );
      await conn.commit();
    });
    res.json({ nodeId });
  } catch (err) {
    logError('memory.saveNode', err, { projectId });
    res.status(500).json({ error: err.message });
  }
});

// POST /:projectId/graph/edges — 에지 생성
router.post('/:projectId/graph/edges', async (req, res) => {
  const { projectId } = req.params;
  const { episodeId, sourceNodeId, targetNodeId, edgeType, weight, properties } = req.body;
  if (!sourceNodeId || !targetNodeId) return res.status(400).json({ error: 'sourceNodeId and targetNodeId required' });

  try {
    const edgeId = `edge_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    await withConnection(async (conn) => {
      await conn.execute(
        `INSERT INTO story_edges (edge_id, project_id, episode_id, source_node_id, target_node_id, edge_type, weight, properties)
         VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`,
        [edgeId, projectId, episodeId || null, sourceNodeId, targetNodeId, edgeType || 'CAUSES', weight || 1, properties ? JSON.stringify(properties) : null]
      );
      await conn.commit();
    });
    res.json({ edgeId });
  } catch (err) {
    logError('memory.saveEdge', err, { projectId });
    res.status(500).json({ error: err.message });
  }
});

// GET /:projectId/graph — 전체 그래프 조회
router.get('/:projectId/graph', async (req, res) => {
  const { projectId } = req.params;
  try {
    let nodes, edges;
    await withConnection(async (conn) => {
      const nodesResult = await conn.execute(
        `SELECT node_id, episode_id, node_type, label, properties, created_at
         FROM story_nodes WHERE project_id = :1
         ORDER BY created_at ASC`,
        [projectId]
      );
      nodes = nodesResult.rows.map(([nodeId, episodeId, nodeType, label, properties, createdAt]) => ({
        nodeId, episodeId, nodeType, label,
        properties: properties ? JSON.parse(properties) : null,
        createdAt,
      }));

      const edgesResult = await conn.execute(
        `SELECT edge_id, episode_id, source_node_id, target_node_id, edge_type, weight
         FROM story_edges WHERE project_id = :1
         ORDER BY created_at ASC`,
        [projectId]
      );
      edges = edgesResult.rows.map(([edgeId, episodeId, sourceNodeId, targetNodeId, edgeType, weight]) => ({
        edgeId, episodeId, sourceNodeId, targetNodeId, edgeType, weight,
      }));
    });
    res.json({ nodes, edges });
  } catch (err) {
    logError('memory.getGraph', err, { projectId });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
