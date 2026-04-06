/**
 * @file projectApi.js
 * @description 프로젝트 관련 API 호출 서비스 (프로젝트 생성, 조회, 수정, 에셋 업데이트 등).
 * @usage features/project, features/script, features/character 등에서 사용.
 * @connects Backend API (/api/projects), useProjectStore
 * @doc docs/01-project.md, docs/06-database.md
 */
import axios from 'axios'
import serializeAssetsPayload from './project/serializeAssetsPayload.js'
import { logError } from '../shared/utils/logger.js'

const api = axios.create({
  baseURL: '/api/projects'
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    logError('projectApi.response', error, {
      method: error.config?.method?.toUpperCase?.() ?? error.config?.method ?? null,
      url: error.config?.url ?? null,
      status: error.response?.status ?? null,
    })
    return Promise.reject(error)
  }
)

export const getProjects = async () => {
  const { data } = await api.get('')
  return data
}

export const createProject = async (title, genre, visual_style) => {
  const { data } = await api.post('', { title, genre, visual_style })
  return data
}

export const getProject = async (projectId) => {
  const { data } = await api.get(`/${projectId}`)
  return data
}

export const updateProject = async (projectId, updates) => {
  const { data } = await api.put(`/${projectId}`, updates)
  return data
}

export const deleteProject = async (projectId) => {
  const { data } = await api.delete(`/${projectId}`)
  return data
}

export const updateStoryCompass = async (projectId, compass) => {
  const { data } = await api.put(`/${projectId}/compass`, compass)
  return data
}

export const updateAssets = async (projectId, assets) => {
  const { data } = await api.put(`/${projectId}/assets`, serializeAssetsPayload(assets))
  return data
}

export const updateCharacterProfile = async (projectId, assetId, profile) => {
  const { data } = await api.put(`/${projectId}/assets/${assetId}/profile`, profile)
  return data
}
