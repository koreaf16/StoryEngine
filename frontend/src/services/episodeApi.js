/**
 * @file episodeApi.js
 * @description 에피소드 관련 API 호출 서비스 (에피소드 CRUD, 골격/샷 저장, 확정).
 * @usage features/episode/*, store/useProjectStore.js
 * @connects Backend API (/api/projects/:id/episodes)
 * @doc docs/05-episode.md
 */
import axios from 'axios'
import { logError } from '../shared/utils/logger.js'

const api = axios.create({ baseURL: '/api/projects' })

api.interceptors.response.use(
  (response) => response,
  (error) => {
    logError('episodeApi.response', error, {
      method: error.config?.method?.toUpperCase?.() ?? error.config?.method ?? null,
      url: error.config?.url ?? null,
      status: error.response?.status ?? null,
    })
    return Promise.reject(error)
  }
)

export const getEpisodes = async (projectId) => {
  const { data } = await api.get(`/${projectId}/episodes`)
  return data
}

export const getEpisode = async (projectId, episodeId) => {
  const { data } = await api.get(`/${projectId}/episodes/${episodeId}`)
  return data
}

export const createEpisode = async (projectId, { episodeNumber, hint }) => {
  const { data } = await api.post(`/${projectId}/episodes`, { episodeNumber, hint })
  return data
}

export const saveSkeleton = async (projectId, episodeId, scenes) => {
  const { data } = await api.put(`/${projectId}/episodes/${episodeId}/skeleton`, { scenes })
  return data
}

export const saveSceneShots = async (projectId, episodeId, sceneNumber, shots) => {
  const { data } = await api.put(`/${projectId}/episodes/${episodeId}/scenes/${sceneNumber}/shots`, { shots })
  return data
}

export const updateShot = async (projectId, episodeId, sceneNumber, shotNumber, updates) => {
  const { data } = await api.patch(`/${projectId}/episodes/${episodeId}/scenes/${sceneNumber}/shots/${shotNumber}`, updates)
  return data
}

export const deleteEpisode = async (projectId, episodeId) => {
  await api.delete(`/${projectId}/episodes/${episodeId}`)
}

export const deleteShot = async (projectId, episodeId, sceneNumber, shotNumber) => {
  await api.delete(`/${projectId}/episodes/${episodeId}/scenes/${sceneNumber}/shots/${shotNumber}`)
}

export const saveScript = async (projectId, episodeId, scriptScenes) => {
  const { data } = await api.put(`/${projectId}/episodes/${episodeId}/script`, { scriptScenes })
  return data
}

export const saveAudioDesign = async (projectId, episodeId, sceneNumber, audioDesign) => {
  const { data } = await api.put(
    `/${projectId}/episodes/${episodeId}/scenes/${sceneNumber}/audio-design`,
    { audioDesign }
  )
  return data
}

export const batchUpdateShots = async (projectId, episodeId, scenes) => {
  const { data } = await api.put(`/${projectId}/episodes/${episodeId}/shots/batch`, { scenes })
  return data
}

export const saveNovelText = async (projectId, episodeId, novelText) => {
  const { data } = await api.put(`/${projectId}/episodes/${episodeId}/novel`, { novelText })
  return data
}

export const confirmEpisode = async (projectId, episodeId) => {
  const { data } = await api.post(`/${projectId}/episodes/${episodeId}/confirm`)
  return data
}
