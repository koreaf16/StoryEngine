/**
 * @file services/memoryApi.js
 * @description 프로젝트 메모리 시스템 API 클라이언트. 씬 벡터, 그래프 노드/에지 CRUD.
 * @usage features/episode/pages/EpisodeConfirmPage.jsx, features/episode/utils/buildPromptNovel.js
 * @connects Backend API (/api/projects/:id/vectors, /api/projects/:id/graph)
 * @doc docs/05-episode.md
 */
import axios from 'axios'
import { logError } from '../shared/utils/logger.js'

const api = axios.create({ baseURL: '/api/projects' })

api.interceptors.response.use(
  (response) => response,
  (error) => {
    logError('memoryApi.response', error, {
      method: error.config?.method?.toUpperCase?.() ?? null,
      url: error.config?.url ?? null,
      status: error.response?.status ?? null,
    })
    return Promise.reject(error)
  }
)

// ─── 씬 벡터 ──────────────────────────────────────────────

export const saveVector = async (projectId, { episodeId, sceneNumber, summaryText }) => {
  const { data } = await api.post(`/${projectId}/vectors`, { episodeId, sceneNumber, summaryText })
  return data
}

export const getVectors = async (projectId) => {
  const { data } = await api.get(`/${projectId}/vectors`)
  return data
}

// ─── 그래프 노드/에지 ──────────────────────────────────────

export const saveNode = async (projectId, { episodeId, nodeType, label, properties }) => {
  const { data } = await api.post(`/${projectId}/graph/nodes`, { episodeId, nodeType, label, properties })
  return data
}

export const saveEdge = async (projectId, { episodeId, sourceNodeId, targetNodeId, edgeType, weight, properties }) => {
  const { data } = await api.post(`/${projectId}/graph/edges`, { episodeId, sourceNodeId, targetNodeId, edgeType, weight, properties })
  return data
}

export const getGraph = async (projectId) => {
  const { data } = await api.get(`/${projectId}/graph`)
  return data
}
