/**
 * @file features/episode/hooks/useSnapGeneration.js
 * @description 스냅 이미지 배치/개별 생성 상태 관리 훅. useAnchorGeneration.js 패턴 기반.
 * @usage features/episode/pages/StoryboardPage.jsx에서 사용.
 * @connects services/snapApi.js, store/useProjectStore.js
 * @doc docs/05-episode.md (5. 스냅 이미지 생성)
 */
import { useState, useCallback, useRef } from 'react'
import { generateSnapsStream, generateShotSnap } from '../../../services/snapApi.js'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'

export default function useSnapGeneration(projectId, episodeId) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(null) // { sceneNumber, shotNumber } | null
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [currentTask, setCurrentTask] = useState(null)   // 현재 진행 중인 작업 설명
  const [latestSnap, setLatestSnap] = useState(null)     // 가장 최근 완성된 스냅 URL
  const [error, setError] = useState(null)
  const abortCtrlRef = useRef(null)

  const setShotSnap = useProjectStore((s) => s.setShotSnap)

  const generate = useCallback(async (force = false) => {
    const ctrl = new AbortController()
    abortCtrlRef.current = ctrl
    setIsGenerating(true)
    setError(null)
    setCompletedCount(0)
    setTotalCount(0)
    setCurrentTask(null)
    setLatestSnap(null)

    try {
      const stream = generateSnapsStream({ projectId, episodeId, force, signal: ctrl.signal })
      for await (const event of stream) {
        if (ctrl.signal.aborted) break

        if (event.type === 'init') {
          setTotalCount(event.total)
          continue
        }
        if (event.type === 'anchor_generating') {
          setCurrentTask(`앵커 생성 중: ${event.display_name}`)
          continue
        }
        if (event.type === 'snap_generating') {
          setCurrentTask(`씬 ${event.scene_number} · 샷 ${event.shot_number} 생성 중`)
          continue
        }
        if (event.type === 'error') {
          logError('useSnapGeneration.generate.event', new Error(event.message), {
            projectId, episodeId, sceneNumber: event.scene_number, shotNumber: event.shot_number,
          })
          setCompletedCount((c) => c + 1)
          continue
        }
        // 스냅 완성 이벤트
        setShotSnap(projectId, episodeId, event.scene_number, event.shot_number, event)
        if (event.snap_image) setLatestSnap(event.snap_image)
        setCompletedCount((c) => c + 1)
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        logError('useSnapGeneration.generate', err, { projectId, episodeId })
        setError(err.message ?? '스냅 생성 실패')
      }
    } finally {
      setIsGenerating(false)
      setCurrentTask(null)
    }
  }, [projectId, episodeId, setShotSnap])

  const regenerate = useCallback(async (sceneNumber, shotNumber) => {
    setIsRegenerating({ sceneNumber, shotNumber })
    setError(null)
    try {
      const result = await generateShotSnap(projectId, episodeId, sceneNumber, shotNumber)
      setShotSnap(projectId, episodeId, sceneNumber, shotNumber, result)
      return result
    } catch (err) {
      logError('useSnapGeneration.regenerate', err, { projectId, episodeId, sceneNumber, shotNumber })
      setError(err.message ?? '스냅 재생성 실패')
      return null
    } finally {
      setIsRegenerating(null)
    }
  }, [projectId, episodeId, setShotSnap])

  const stop = useCallback(async () => {
    abortCtrlRef.current?.abort()
    setIsGenerating(false)
    try {
      await fetch('/api/visual/comfyui/interrupt', { method: 'POST' })
    } catch (err) {
      logError('useSnapGeneration.stop', err, { projectId, episodeId })
    }
  }, [projectId, episodeId])

  return { isGenerating, isRegenerating, completedCount, totalCount, currentTask, latestSnap, error, generate, regenerate, stop }
}
