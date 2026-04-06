/**
 * @file SkeletonPromptPage.jsx
 * @description 4b. 골격/씬 프롬프트 페이지. D(골격) → D2(대본) → E(씬별 샷) → F(씬별 사운드) 순차 진행.
 * @usage 라우트 "/project/:id/episode/:episodeId/skeleton"
 * @connects ProgressChecklist, NewAssetAlert, PromptCopyPaste, buildPromptD/D2/E/F, parsers
 * @doc docs/05-episode.md (골격 생성 + 대본 + 씬별 샷 + 사운드)
 */
import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import PromptCopyPaste from '../../../shared/components/patterns/PromptCopyPaste.jsx'
import ProgressChecklist from '../components/skeleton/ProgressChecklist.jsx'
import NewAssetAlert from '../components/skeleton/NewAssetAlert.jsx'
import buildPromptD from '../utils/buildPromptD.js'
import buildPromptD2 from '../utils/buildPromptD2.js'
import buildPromptE from '../utils/buildPromptE.js'
import buildPromptF from '../utils/buildPromptF.js'
import parseSkeletonJson from '../utils/parseSkeletonJson.js'
import parseScriptJson from '../utils/parseScriptJson.js'
import parseShotJson from '../utils/parseShotJson.js'
import parseAudioDesignJson from '../utils/parseAudioDesignJson.js'

const EMPTY_ASSETS = []

// 데모 모드: 씬 1개만 생성하여 빠르게 영상 제작 진입 (테스트용)
const DEMO_MODE = true

export default function SkeletonPromptPage() {
  const { id, episodeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const project = useProjectStore((s) => s.getProject(id))
  const saveSkeleton = useProjectStore((s) => s.saveSkeleton)
  const saveScript = useProjectStore((s) => s.saveScript)
  const saveSceneShots = useProjectStore((s) => s.saveSceneShots)
  const saveAudioDesign = useProjectStore((s) => s.saveAudioDesign)
  const updateEpisode = useProjectStore((s) => s.updateEpisode)
  const addAsset = useProjectStore((s) => s.addAsset)

  const existingEpisode = project?.episodes?.find((ep) => ep.id === episodeId)
  const existingScenes = existingEpisode?.scenes || []

  const [scenes, setScenes] = useState(() => existingScenes)
  const [scriptScenes, setScriptScenes] = useState(() => existingEpisode?.scriptScenes || [])
  const [audioDesigns, setAudioDesigns] = useState(() => [])
  const [phase, setPhase] = useState(() => {
    if (existingScenes.length === 0) return 'SKELETON'
    if (!existingEpisode?.scriptScenes?.length) return 'SCRIPT'
    const nextShot = existingScenes.findIndex((s) => !s.shots || s.shots.length === 0)
    return nextShot >= 0 ? 'SHOTS' : 'DONE'
  })
  const [currentSceneIdx, setCurrentSceneIdx] = useState(() => {
    if (existingScenes.length === 0) return 0
    const nextIdx = existingScenes.findIndex((s) => !s.shots || s.shots.length === 0)
    return nextIdx >= 0 ? nextIdx : 0
  })
  const [newAssets, setNewAssets] = useState([])
  const [error, setError] = useState('')

  const hint = location.state?.hint || ''
  const episodeNumber = location.state?.episodeNumber
    || existingEpisode?.episode_number
    || (project?.episodes?.filter((ep) => ep.status === 'CONFIRMED')?.length || 0) + 1

  const assets = project?.assets ?? EMPTY_ASSETS
  const currentScene = scenes[currentSceneIdx]

  // 현재 씬의 D2 대사 목록
  const currentSceneDialogues = useMemo(() => {
    if (!currentScene || !scriptScenes.length) return []
    const found = scriptScenes.find((s) => s.scene_number === currentScene.scene_number)
    return found?.dialogues || []
  }, [currentScene, scriptScenes])

  // 프롬프트 빌드
  const promptD = useMemo(() => {
    if (!project) return ''
    const demoHint = DEMO_MODE ? '[데모 모드] 씬을 정확히 1개만 생성하라. 그 이상 생성하지 마라.' : ''
    const combinedHint = [demoHint, hint].filter(Boolean).join('\n')
    return buildPromptD({
      episodeNumber,
      assets,
      storyCompass: typeof project.storyCompass === 'string' ? project.storyCompass : JSON.stringify(project.storyCompass),
      characterProfiles: null,
      memory: null,
      userHint: combinedHint,
    })
  }, [project, episodeNumber, assets, hint])

  const promptD2 = useMemo(() => {
    if (!scenes.length || !project) return ''
    return buildPromptD2({ episodeNumber, scenes, assets })
  }, [scenes, episodeNumber, assets, project])

  const promptE = useMemo(() => {
    if (!currentScene || !project) return ''
    const previousShots = currentSceneIdx > 0 ? (scenes[currentSceneIdx - 1]?.shots ?? null) : null
    return buildPromptE({
      episodeNumber,
      scene: currentScene,
      assets,
      previousShots,
      sceneDialogues: currentSceneDialogues,
    })
  }, [currentScene, currentSceneIdx, scenes, episodeNumber, assets, project, currentSceneDialogues])

  const promptF = useMemo(() => {
    if (!currentScene || !project) return ''
    return buildPromptF({
      episodeNumber,
      scene: currentScene,
      shots: currentScene.shots || [],
      sceneDialogues: currentSceneDialogues,
      allScenes: scenes,
    })
  }, [currentScene, scenes, episodeNumber, project, currentSceneDialogues])

  // 사운드 단계 SKIP: 모든 샷 완료 시 바로 스토리보드로
  useEffect(() => {
    if (phase === 'DONE') {
      navigate(`/project/${id}/episode/${episodeId}/storyboard`)
    }
  }, [phase, id, episodeId, navigate])

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-slate-500">프로젝트를 찾을 수 없습니다.</div>
  }

  const detectNewAssets = (parsedScenes) => {
    const existingIds = new Set(assets.map((a) => a.asset_id))
    const detected = []
    for (const scene of parsedScenes) {
      for (const charId of scene.characters) {
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
          })
        }
      }
    }
    return detected
  }

  const handleSkeletonSubmit = (response) => {
    setError('')
    const result = parseSkeletonJson(response)
    if (!result.ok) { setError(result.error); return }

    const finalScenes = DEMO_MODE ? result.scenes.slice(0, 1) : result.scenes
    const detected = detectNewAssets(finalScenes)
    if (detected.length > 0) {
      setNewAssets(detected)
      setScenes(finalScenes)
      return
    }
    setScenes(finalScenes)
    saveSkeleton(id, episodeId, finalScenes).catch((error) => {
      logError('SkeletonPromptPage.saveSkeleton', error, { projectId: id, episodeId })
    })
    setPhase('SCRIPT')
  }

  const handleConfirmNewAssets = () => {
    newAssets.forEach((a) => {
      addAsset(id, a).catch((error) => {
        logError('SkeletonPromptPage.addAsset', error, { projectId: id, episodeId, assetId: a.asset_id })
      })
    })
    setNewAssets([])
    const finalScenes = DEMO_MODE ? scenes.slice(0, 1) : scenes
    setScenes(finalScenes)
    saveSkeleton(id, episodeId, finalScenes).catch((error) => {
      logError('SkeletonPromptPage.saveSkeletonAfterAssets', error, { projectId: id, episodeId })
    })
    setPhase('SCRIPT')
  }

  const handleScriptSubmit = (response) => {
    setError('')
    const result = parseScriptJson(response)
    if (!result.ok) { setError(result.error); return }

    setScriptScenes(result.scriptScenes)
    saveScript(id, episodeId, result.scriptScenes).catch((error) => {
      logError('SkeletonPromptPage.saveScript', error, { projectId: id, episodeId })
    })
    setPhase('SHOTS')
    setCurrentSceneIdx(0)
  }

  const handleShotSubmit = (response) => {
    setError('')
    const result = parseShotJson(response)
    if (!result.ok) { setError(result.error); return }

    const updated = scenes.map((s, i) =>
      i === currentSceneIdx ? { ...s, shots: result.shots } : s
    )
    setScenes(updated)
    saveSceneShots(id, episodeId, currentScene.scene_number, result.shots).catch((error) => {
      logError('SkeletonPromptPage.saveSceneShots', error, { projectId: id, episodeId, sceneNumber: currentScene.scene_number })
    })

    // 다음 씬으로 이동하거나 스토리보드로 (사운드 단계 SKIP)
    const nextIdx = updated.findIndex((s, i) => i > currentSceneIdx && (!s.shots || s.shots.length === 0))
    if (nextIdx >= 0) {
      setCurrentSceneIdx(nextIdx)
    } else {
      updateEpisode(id, episodeId, { status: 'STORYBOARD', scenes: updated })
      navigate(`/project/${id}/episode/${episodeId}/storyboard`)
    }
  }

  const handleSoundSubmit = (response) => {
    setError('')
    const result = parseAudioDesignJson(response)
    if (!result.ok) { setError(result.error); return }

    const updated = [...audioDesigns]
    const existingIdx = updated.findIndex((a) => a.scene_number === result.audioDesign.scene_number)
    if (existingIdx >= 0) {
      updated[existingIdx] = result.audioDesign
    } else {
      updated.push(result.audioDesign)
    }
    setAudioDesigns(updated)

    saveAudioDesign(id, episodeId, currentScene.scene_number, result.audioDesign).catch((error) => {
      logError('SkeletonPromptPage.saveAudioDesign', error, { projectId: id, episodeId, sceneNumber: currentScene.scene_number })
    })

    const nextIdx = scenes.findIndex((s, i) => i > currentSceneIdx && !updated.find((a) => a.scene_number === s.scene_number))
    if (nextIdx >= 0) {
      setCurrentSceneIdx(nextIdx)
    } else {
      updateEpisode(id, episodeId, { status: 'STORYBOARD', scenes })
      navigate(`/project/${id}/episode/${episodeId}/storyboard`)
    }
  }

  // 현재 단계에 맞는 프롬프트/핸들러/레이블
  const phaseConfig = {
    SKELETON: {
      title: `에피소드 ${episodeNumber} — 골격 생성`,
      description: '씬 구성을 JSON으로 생성합니다',
      promptLabel: '프롬프트 D: 에피소드 골격 생성',
      promptText: promptD,
      submitLabel: '골격 저장 →',
      onSubmit: handleSkeletonSubmit,
    },
    SCRIPT: {
      title: `에피소드 ${episodeNumber} — 대본 생성`,
      description: '글이 먼저다. 모든 씬의 대사를 한 번에 생성합니다.',
      promptLabel: '프롬프트 D2: 에피소드 대본 (대사 + 감정)',
      promptText: promptD2,
      submitLabel: '대본 저장 →',
      onSubmit: handleScriptSubmit,
    },
    SHOTS: {
      title: `에피소드 ${episodeNumber} — 씬 ${currentScene?.scene_number} 샷 생성`,
      description: `"${currentScene?.title}" — ${currentScene?.core_event}`,
      promptLabel: `프롬프트 E: 씬 ${currentScene?.scene_number} 샷 생성`,
      promptText: promptE,
      submitLabel: '샷 저장 →',
      onSubmit: handleShotSubmit,
    },
    SOUND: {
      title: `에피소드 ${episodeNumber} — 씬 ${currentScene?.scene_number} 사운드 설계`,
      description: `"${currentScene?.title}" — 4레이어 오디오 아키텍처`,
      promptLabel: `프롬프트 F: 씬 ${currentScene?.scene_number} 사운드 설계`,
      promptText: promptF,
      submitLabel: '사운드 저장 →',
      onSubmit: handleSoundSubmit,
    },
  }

  const current = phaseConfig[phase]

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-100">{current.title}</h1>
          {DEMO_MODE && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              DEMO
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-1">{current.description}</p>
        {DEMO_MODE && <p className="text-xs text-amber-500/70 mt-0.5">씬 1개 · 사운드 SKIP — 빠른 테스트 모드</p>}
      </div>

      <ProgressChecklist
        phase={phase}
        scenes={scenes}
        scriptDone={scriptScenes.length > 0}
        currentSceneIndex={currentSceneIdx}
      />

      {newAssets.length > 0 && (
        <NewAssetAlert
          newAssets={newAssets}
          onConfirm={handleConfirmNewAssets}
          onDismiss={() => { setNewAssets([]); setScenes([]) }}
        />
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>
      )}

      {newAssets.length === 0 && (
        <PromptCopyPaste
          key={`${phase}-${currentSceneIdx}`}
          title={current.promptLabel}
          description={current.description}
          promptText={current.promptText}
          submitLabel={current.submitLabel}
          onSubmit={current.onSubmit}
        />
      )}
    </div>
  )
}
