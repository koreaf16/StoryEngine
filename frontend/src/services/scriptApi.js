/**
 * @file scriptApi.js
 * @description 스크립트 단계 원문 스냅샷 조회/저장 API 호출 서비스.
 * @usage features/script/pages/PromptAPage.jsx, PromptBPage.jsx 에서 사용.
 * @connects Backend API (/api/projects/:id/script-stages/:stage)
 * @doc docs/02-script-input.md, docs/06-database.md
 */
import axios from 'axios'
import { logError } from '../shared/utils/logger.js'

const api = axios.create({ baseURL: '/api/projects' })

api.interceptors.response.use(
  (response) => response,
  (error) => {
    logError('scriptApi.response', error, {
      method: error.config?.method?.toUpperCase?.() ?? error.config?.method ?? null,
      url: error.config?.url ?? null,
      status: error.response?.status ?? null,
    })
    return Promise.reject(error)
  }
)

export const getScriptStage = async (projectId, stage) => {
  const { data } = await api.get(`/${projectId}/script-stages/${stage}`)
  return data
}

export const saveScriptStage = async (projectId, stage, payload) => {
  const { data } = await api.put(`/${projectId}/script-stages/${stage}`, payload)
  return data
}
