/**
 * @file useProjectStore.js
 * @description Zustand 스토어. 프로젝트/에셋/방향타 상태 관리 (Backend DB 연동)
 * @connects store/slices/episodeSlice.js
 */
import { create } from 'zustand'
import * as api from '../services/projectApi'
import * as episodeApi from '../services/episodeApi'
import { logError } from '../shared/utils/logger.js'
import normalizeProjectDetail from './utils/normalizeProjectDetail.js'
import { createEpisodeSlice } from './slices/episodeSlice.js'

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  fetchError: null,

  fetchProjects: async () => {
    set({ isLoading: true })
    try {
      const projects = await api.getProjects()
      set({ projects })
    } finally {
      set({ isLoading: false })
    }
  },

  getProject: (id) => (
    (get().currentProject?.id === id ? get().currentProject : null)
    || get().projects.find((p) => p.id === id)
  ),

  fetchProjectDetail: async (id) => {
    set({ isLoading: true, fetchError: null })
    try {
      const [detail, episodes] = await Promise.all([
        api.getProject(id).then(normalizeProjectDetail),
        episodeApi.getEpisodes(id).catch(() => []),
      ])
      detail.episodes = episodes
      set((s) => ({
        currentProject: detail,
        projects: s.projects.some(p => p.id === id)
          ? s.projects.map(p => p.id === id ? { ...p, ...detail } : p)
          : [...s.projects, detail]
      }))
    } catch (err) {
      logError('useProjectStore.fetchProjectDetail', err, { projectId: id })
      const status = err.response?.status
      const serverMessage = err.response?.data?.error
      const message = serverMessage
        || (status === 404 ? 'Project not found' : null)
        || err.message
        || 'Failed to load project'
      set({ fetchError: message })
    } finally {
      set({ isLoading: false })
    }
  },

  createProject: async (title, genre, visual_style) => {
    const newProject = await api.createProject(title, genre, visual_style)
    const fullProject = { ...newProject, assets: [], seed: '', storyCompass: null, worldBackbone: '' }
    set((s) => ({ projects: [...s.projects, fullProject], currentProject: fullProject }))
    return newProject.id
  },

  deleteProject: async (id) => {
    await api.deleteProject(id)
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProject: s.currentProject?.id === id ? null : s.currentProject,
    }))
  },

  updateProjectStatus: async (id, status) => {
    await api.updateProject(id, { status })
    set((s) => ({
      currentProject: s.currentProject?.id === id ? { ...s.currentProject, status } : s.currentProject,
      projects: s.projects.map((p) => p.id === id ? { ...p, status } : p),
    }))
  },

  updateSeed: async (id, seed) => {
    await api.updateProject(id, { seed })
    set((s) => ({
      currentProject: s.currentProject?.id === id ? { ...s.currentProject, seed } : s.currentProject,
      projects: s.projects.map((p) => p.id === id ? { ...p, seed } : p),
    }))
  },

  saveWorldBackbone: async (id, text) => {
    await api.updateProject(id, { worldBackbone: text })
    set((s) => ({
      currentProject: s.currentProject?.id === id ? { ...s.currentProject, worldBackbone: text } : s.currentProject,
      projects: s.projects.map((p) => p.id === id ? { ...p, worldBackbone: text } : p),
    }))
  },

  saveStoryCompass: async (id, compass) => {
    await api.updateStoryCompass(id, compass)
    set((s) => ({
      currentProject: s.currentProject?.id === id ? { ...s.currentProject, storyCompass: compass } : s.currentProject,
      projects: s.projects.map((p) => p.id === id ? { ...p, storyCompass: compass } : p),
    }))
  },

  saveAssets: async (id, assets) => {
    await api.updateAssets(id, assets)
    set((s) => ({
      currentProject: s.currentProject?.id === id ? { ...s.currentProject, assets } : s.currentProject,
      projects: s.projects.map((p) => p.id === id ? { ...p, assets, assetCount: assets.length } : p),
    }))
  },

  updateAsset: async (projectId, assetId, updates) => {
    // For local UI update immediately, then backend. 
    // Ideally should sync with backend first. For prototype, we sync whole asset list or profile.
    const proj = get().getProject(projectId)
    if(!proj) return;
    const newAssets = proj.assets.map(a => a.asset_id === assetId ? { ...a, ...updates } : a)
    await api.updateAssets(projectId, newAssets)
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, assets: newAssets } : s.currentProject,
      projects: s.projects.map((p) => p.id === projectId ? { ...p, assets: newAssets } : p),
    }))
  },

  addAsset: async (projectId, asset) => {
    const proj = get().getProject(projectId)
    if(!proj) return;
    const newAssets = [...proj.assets, asset]
    await api.updateAssets(projectId, newAssets)
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, assets: newAssets } : s.currentProject,
      projects: s.projects.map((p) => p.id === projectId ? { ...p, assets: newAssets, assetCount: newAssets.length } : p),
    }))
  },

  removeAsset: async (projectId, assetId) => {
    const proj = get().getProject(projectId)
    if(!proj) return;
    const newAssets = proj.assets.filter((a) => a.asset_id !== assetId)
    await api.updateAssets(projectId, newAssets)
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, assets: newAssets } : s.currentProject,
      projects: s.projects.map((p) => p.id === projectId ? { ...p, assets: newAssets, assetCount: newAssets.length } : p),
    }))
  },

  confirmAssets: async (id) => {
    await api.updateProject(id, { assetsConfirmed: true, status: 'CHARACTER' })
    set((s) => ({
      currentProject: s.currentProject?.id === id ? { ...s.currentProject, assetsConfirmed: true, status: 'CHARACTER' } : s.currentProject,
      projects: s.projects.map((p) => p.id === id ? { ...p, assetsConfirmed: true, status: 'CHARACTER' } : p),
    }))
  },

  // ── Visual Factory 액션 ──────────────────────────────────────
  setAnchorCandidates: (projectId, assetId, candidates) =>
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? {
        ...s.currentProject,
        assets: s.currentProject.assets.map(a => a.asset_id === assetId ? { ...a, anchor_candidates: candidates, pipeline_status: 'ANCHOR_GENERATING' } : a)
      } : s.currentProject,
      projects: s.projects.map((p) => p.id === projectId ? { ...p, assets: p.assets.map((a) => a.asset_id === assetId ? { ...a, anchor_candidates: candidates, pipeline_status: 'ANCHOR_GENERATING' } : a) } : p),
    })),

  selectAnchor: (projectId, assetId, anchorData) =>
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? {
        ...s.currentProject,
        assets: s.currentProject.assets.map(a => a.asset_id === assetId ? { ...a, anchor_image: anchorData, anchor_embedding: anchorData.embedding ?? null, pipeline_status: 'ANCHOR_SELECTED' } : a)
      } : s.currentProject,
      projects: s.projects.map((p) => p.id === projectId ? { ...p, assets: p.assets.map((a) => a.asset_id === assetId ? { ...a, anchor_image: anchorData, anchor_embedding: anchorData.embedding ?? null, pipeline_status: 'ANCHOR_SELECTED' } : a) } : p),
    })),

  setDerivedImages: (projectId, assetId, images, status = 'DERIVED_FILTERED') =>
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? {
        ...s.currentProject,
        assets: s.currentProject.assets.map(a => a.asset_id === assetId ? { ...a, derived_images: images, pipeline_status: status } : a)
      } : s.currentProject,
      projects: s.projects.map((p) => p.id === projectId ? { ...p, assets: p.assets.map((a) => a.asset_id === assetId ? { ...a, derived_images: images, pipeline_status: status } : a) } : p),
    })),

  // ── Character 액션 ──────────────────────────────────────────
  saveCharacterProfile: async (projectId, assetId, profile, status = 'AUTO') => {
    await api.updateCharacterProfile(projectId, assetId, { ...profile, profile_status: status })
    // local update
    set((s) => {
      const updateAssetFunc = a => a.asset_id === assetId ? { ...a, ...profile, profile_status: status } : a
      return {
        currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, assets: s.currentProject.assets.map(updateAssetFunc) } : s.currentProject,
        projects: s.projects.map((p) => p.id === projectId ? { ...p, assets: p.assets.map(updateAssetFunc) } : p),
      }
    })
  },

  // LoRA 연결 해제 후 에셋을 DERIVED_FILTERED 상태로 초기화
  resetLoraAsset: (projectId, assetId) =>
    set((s) => {
      const resetAsset = (a) => a.asset_id === assetId
        ? { ...a, lora_path: null, trigger_word: null, lora_result: null, visual_strategy: 'PROMPT', pipeline_status: 'DERIVED_FILTERED' }
        : a
      return {
        currentProject: s.currentProject?.id === projectId
          ? { ...s.currentProject, assets: s.currentProject.assets.map(resetAsset) }
          : s.currentProject,
        projects: s.projects.map((p) => p.id === projectId
          ? { ...p, assets: p.assets.map(resetAsset) }
          : p),
      }
    }),

  confirmCharacterProfile: async (projectId, assetId) => {
    await api.updateCharacterProfile(projectId, assetId, { profile_status: 'CONFIRMED' })
    set((s) => {
      const updateAssetFunc = a => a.asset_id === assetId ? { ...a, profile_status: 'CONFIRMED' } : a
      return {
        currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, assets: s.currentProject.assets.map(updateAssetFunc) } : s.currentProject,
        projects: s.projects.map((p) => p.id === projectId ? { ...p, assets: p.assets.map(updateAssetFunc) } : p),
      }
    })
  },

  resetPipeline: async (projectId, assetId) => {
    set((s) => {
      const updateAssetFunc = a => a.asset_id === assetId ? {
        ...a,
        pipeline_status: 'NONE',
        anchor_candidates: [],
        anchor_image: null,
        anchor_embedding: null,
        derived_images: [],
        visual_strategy: 'PROMPT',
      } : a
      return {
        currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, assets: s.currentProject.assets.map(updateAssetFunc) } : s.currentProject,
        projects: s.projects.map((p) => p.id === projectId ? { ...p, assets: p.assets.map(updateAssetFunc) } : p),
      }
    })
  },

  ...createEpisodeSlice(set),
}))

export default useProjectStore
