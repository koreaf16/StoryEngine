/**
 * @file useChainDesign.js
 * @description ChainDesignPage 상태·핸들러 훅. CHAIN2→CHAIN4→CHAIN5→DONE 단계 관리.
 * @usage ChainDesignPage.jsx에서 사용.
 * @connects buildPromptChain2/4/5, parseChain2/4/5Json, useProjectStore, episodeApi
 * @doc docs/05-episode.md (Chain 2~5 흐름)
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import buildPromptChain2 from '../utils/buildPromptChain2.js'
import buildPromptChain4 from '../utils/buildPromptChain4.js'
import buildPromptChain5 from '../utils/buildPromptChain5.js'
import parseChain2Json from '../utils/parseChain2Json.js'
import parseChain4Json from '../utils/parseChain4Json.js'
import parseChain5Json from '../utils/parseChain5Json.js'

const DEMO_MODE = true

export default function useChainDesign({ projectId, episodeId, episodeNumber }) {
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(projectId))
  const saveChainDesign = useProjectStore((s) => s.saveChainDesign)
  const updateEpisode = useProjectStore((s) => s.updateEpisode)
  const addAsset = useProjectStore((s) => s.addAsset)

  const existingEpisode = project?.episodes?.find((ep) => ep.id === episodeId)
  const [scenes, setScenes] = useState(() => existingEpisode?.scenes || [])
  const [phase, setPhase] = useState(() => {
    const s = existingEpisode?.scenes || []
    if (!s.length) return 'CHAIN2'
    const allShots = s.flatMap((sc) => sc.shots || [])
    if (allShots.length > 0 && allShots.every((sh) => sh.video_prompt)) return 'CHAIN5_DONE'
    if (allShots.length > 0 && allShots.every((sh) => sh.render_prompt)) return 'CHAIN5'
    return 'CHAIN4'
  })
  const [newAssets, setNewAssets] = useState([])
  const [error, setError] = useState('')

  const assets = project?.assets ?? []
  const novelText = existingEpisode?.novel_text || ''

  const promptChain2 = useMemo(() => buildPromptChain2({
    episodeNumber, novelText, assets, demoMode: DEMO_MODE,
  }), [episodeNumber, novelText, assets])

  const promptChain4 = useMemo(() => {
    if (scenes.length === 0) return ''
    return buildPromptChain4({ episodeNumber, scenes, assets, demoMode: DEMO_MODE })
  }, [episodeNumber, scenes, assets])

  const promptChain5 = useMemo(() => {
    if (scenes.length === 0) return ''
    return buildPromptChain5({ episodeNumber, scenes, demoMode: DEMO_MODE })
  }, [episodeNumber, scenes])

  const detectNewAssets = (parsedScenes, currentAssets) => {
    const existingIds = new Set(currentAssets.map((a) => a.asset_id))
    const detected = []
    for (const sc of parsedScenes) {
      for (const charId of (sc.characters || [])) {
        if (!existingIds.has(charId) && !detected.find((d) => d.asset_id === charId)) {
          detected.push({
            asset_id: charId,
            display_name: charId.replace(/^(char_|npc_|loc_|item_|mon_)/, ''),
            asset_type: charId.startsWith('npc_') ? 'NPC' : 'CHARACTER',
            visual_strategy: 'PROMPT',
            audio_type: 'TTS',
            voice_hint: '',
            appearance_prompt: '',
            pipeline_status: 'NONE',
            is_protagonist: false,
          })
        }
      }
    }
    return detected
  }

  const handleChain2Submit = (response) => {
    setError('')
    const result = parseChain2Json(response)
    if (!result.ok) { setError(result.error); return }
    const finalScenes = DEMO_MODE ? result.scenes.slice(0, 1) : result.scenes
    setScenes(finalScenes)
    saveChainDesign(projectId, episodeId, finalScenes).catch((err) => {
      logError('useChainDesign.chain2', err, { projectId, episodeId })
    })
    const detected = detectNewAssets(finalScenes, assets)
    if (detected.length > 0) {
      detected.forEach((a) => addAsset(projectId, a).catch(() => {}))
      setNewAssets(detected)
    } else {
      setPhase('CHAIN4')
    }
  }

  const handleNewAssetsConfirmed = () => {
    setNewAssets([])
    setPhase('CHAIN4')
  }

  const handleChain4Submit = (response) => {
    setError('')
    const result = parseChain4Json(response)
    if (!result.ok) { setError(result.error); return }
    const updated = applyImagePrompts(scenes, result.imagePrompts)
    setScenes(updated)
    saveChainDesign(projectId, episodeId, updated).catch((err) => {
      logError('useChainDesign.chain4', err, { projectId, episodeId })
    })
    setPhase('CHAIN5')
  }

  const handleChain5Submit = (response) => {
    setError('')
    const result = parseChain5Json(response)
    if (!result.ok) { setError(result.error); return }
    const updated = applyVideoPrompts(scenes, result.videoPrompts)
    setScenes(updated)
    saveChainDesign(projectId, episodeId, updated).catch((err) => {
      logError('useChainDesign.chain5', err, { projectId, episodeId })
    })
    updateEpisode(projectId, episodeId, { status: 'STORYBOARD', scenes: updated })
    navigate(`/project/${projectId}/episode/${episodeId}/storyboard`)
  }

  return {
    phase, scenes, error, DEMO_MODE, newAssets,
    promptChain2, promptChain4, promptChain5,
    handleChain2Submit, handleChain4Submit, handleChain5Submit, handleNewAssetsConfirmed,
  }
}

function applyImagePrompts(scenes, imagePrompts) {
  return scenes.map((sc) => ({
    ...sc,
    shots: (sc.shots || []).map((sh) => {
      const found = imagePrompts.find(
        (ip) => ip.scene_number === sc.scene_number && ip.shot_number === sh.shot_number
      )
      return found ? { ...sh, render_prompt: found.render_prompt } : sh
    }),
  }))
}

function applyVideoPrompts(scenes, videoPrompts) {
  return scenes.map((sc) => ({
    ...sc,
    shots: (sc.shots || []).map((sh) => {
      const found = videoPrompts.find(
        (vp) => vp.scene_number === sc.scene_number && vp.shot_number === sh.shot_number
      )
      return found ? { ...sh, video_prompt: found.video_prompt, duration_sec: found.duration_sec } : sh
    }),
  }))
}
