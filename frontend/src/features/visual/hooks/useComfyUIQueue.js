/**
 * @file useComfyUIQueue.js
 * @description ComfyUI 큐/진행률 폴링 훅. 생성 중일 때만 활성화.
 * @usage AnchorSelectPage, DerivedImagesPage에서 실시간 큐 상태 표시 시 사용.
 * @connects /api/visual/comfyui/queue
 * @doc docs/04-visual-factory.md (ComfyUI 큐 상태)
 */
import { useState, useEffect, useRef } from 'react'
import { logError } from '../../../shared/utils/logger.js'

export default function useComfyUIQueue(isActive, intervalMs = 800) {
  const [queue, setQueue] = useState({ running: 0, pending: 0 })
  const [progress, setProgress] = useState({ value: 0, max: 0 })
  const [wsConnected, setWsConnected] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!isActive) return

    async function fetchQueue() {
      try {
        const res = await fetch('/api/visual/comfyui/queue')
        if (!res.ok) return
        const data = await res.json()
        setQueue(data.queue ?? { running: 0, pending: 0 })
        setProgress(data.progress ?? { value: 0, max: 0 })
        setWsConnected(data.ws_connected ?? false)
      } catch (error) {
        logError('useComfyUIQueue.fetchQueue', error, { isActive, intervalMs })
        // 연결 오류 무시
      }
    }

    fetchQueue()
    timerRef.current = setInterval(fetchQueue, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [isActive, intervalMs])

  const effectiveQueue = isActive ? queue : { running: 0, pending: 0 }
  const effectiveProgress = isActive ? progress : { value: 0, max: 0 }
  const effectiveWsConnected = isActive ? wsConnected : false

  const progressPct = effectiveProgress.max > 0
    ? Math.round((effectiveProgress.value / effectiveProgress.max) * 100)
    : 0

  return { queue: effectiveQueue, progress: effectiveProgress, progressPct, wsConnected: effectiveWsConnected }
}
