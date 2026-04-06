/**
 * @file store/slices/episodeSlice.js
 * @description 에피소드 관련 Zustand 슬라이스. fetch/create/delete/save/update/confirm 액션.
 * @usage useProjectStore.js에서 spread하여 사용.
 * @connects services/episodeApi.js
 * @doc docs/05-episode.md
 */
import * as episodeApi from '../../services/episodeApi'

export const createEpisodeSlice = (set) => ({
  fetchEpisodes: async (projectId) => {
    const episodes = await episodeApi.getEpisodes(projectId)
    const updateProj = (p) => p.id === projectId ? { ...p, episodes } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, episodes } : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  deleteEpisode: async (projectId, episodeId) => {
    await episodeApi.deleteEpisode(projectId, episodeId)
    const removeEp = (p) => p.id === projectId
      ? { ...p, episodes: (p.episodes || []).filter((ep) => ep.id !== episodeId) }
      : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? removeEp(s.currentProject) : s.currentProject,
      projects: s.projects.map(removeEp),
    }))
  },

  createEpisode: async (projectId, episodeNumber, hint = '') => {
    const episode = await episodeApi.createEpisode(projectId, { episodeNumber, hint })
    set((s) => {
      const addEp = (p) => p.id === projectId ? { ...p, episodes: [...(p.episodes || []), episode] } : p
      return {
        currentProject: s.currentProject?.id === projectId ? addEp(s.currentProject) : s.currentProject,
        projects: s.projects.map(addEp),
      }
    })
    return episode
  },

  saveChainDesign: async (projectId, episodeId, scenes) => {
    await episodeApi.batchUpdateShots(projectId, episodeId, scenes)
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, scenes, status: 'CHAIN_DESIGN' } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  saveNovelText: async (projectId, episodeId, novelText) => {
    await episodeApi.saveNovelText(projectId, episodeId, novelText)
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, novel_text: novelText, status: 'NOVEL' } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  saveSkeleton: async (projectId, episodeId, scenes) => {
    await episodeApi.saveSkeleton(projectId, episodeId, scenes)
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, scenes, status: 'SKELETON' } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  saveSceneShots: async (projectId, episodeId, sceneNumber, shots) => {
    await episodeApi.saveSceneShots(projectId, episodeId, sceneNumber, shots)
    const updateScene = (sc) => sc.scene_number === sceneNumber ? { ...sc, shots } : sc
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, scenes: ep.scenes.map(updateScene) } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  saveScript: async (projectId, episodeId, scriptScenes) => {
    await episodeApi.saveScript(projectId, episodeId, scriptScenes)
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, scriptScenes } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  saveAudioDesign: async (projectId, episodeId, sceneNumber, audioDesign) => {
    await episodeApi.saveAudioDesign(projectId, episodeId, sceneNumber, audioDesign)
    const updateScene = (sc) => sc.scene_number === sceneNumber ? { ...sc, audio_design: audioDesign } : sc
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, scenes: ep.scenes.map(updateScene) } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  updateEpisode: (projectId, episodeId, updates) => {
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, ...updates } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  updateShot: async (projectId, episodeId, sceneNumber, shotNumber, updates) => {
    await episodeApi.updateShot(projectId, episodeId, sceneNumber, shotNumber, updates)
    const updateSh = (sh) => sh.shot_number === shotNumber ? { ...sh, ...updates } : sh
    const updateScene = (sc) => sc.scene_number === sceneNumber ? { ...sc, shots: sc.shots.map(updateSh) } : sc
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, scenes: ep.scenes.map(updateScene) } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  deleteShot: async (projectId, episodeId, sceneNumber, shotNumber) => {
    await episodeApi.deleteShot(projectId, episodeId, sceneNumber, shotNumber)
    const removeShot = (sc) => sc.scene_number === sceneNumber
      ? { ...sc, shots: sc.shots.filter((sh) => sh.shot_number !== shotNumber) } : sc
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, scenes: ep.scenes.map(removeShot) } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  setShotSnap: (projectId, episodeId, sceneNumber, shotNumber, snapData) => {
    const updateSh = (sh) => sh.shot_number === shotNumber
      ? { ...sh, snap_image_id: snapData.snap_image_id, snap_image: snapData.snap_image } : sh
    const updateScene = (sc) => sc.scene_number === sceneNumber ? { ...sc, shots: (sc.shots || []).map(updateSh) } : sc
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, scenes: (ep.scenes || []).map(updateScene) } : ep
    const updateProj = (p) => p.id === projectId ? { ...p, episodes: (p.episodes || []).map(updateEp) } : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },

  confirmEpisode: async (projectId, episodeId) => {
    await episodeApi.confirmEpisode(projectId, episodeId)
    const updateEp = (ep) => ep.id === episodeId ? { ...ep, status: 'CONFIRMED' } : ep
    const updateProj = (p) => p.id === projectId
      ? { ...p, episodes: (p.episodes || []).map(updateEp), episodeCount: (p.episodeCount || 0) + 1, status: 'EPISODE' }
      : p
    set((s) => ({
      currentProject: s.currentProject?.id === projectId ? updateProj(s.currentProject) : s.currentProject,
      projects: s.projects.map(updateProj),
    }))
  },
})
