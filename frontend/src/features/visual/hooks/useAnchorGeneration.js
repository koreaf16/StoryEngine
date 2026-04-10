/**
 * @file useAnchorGeneration.js
 * @description 앵커 후보 생성 API 호출 + 스트리밍 상태 관리 훅.
 * 생성 시작 시 즉시 candidates를 클리어하고 완료되는 이미지를 하나씩 추가.
 * @usage AnchorSelectPage에서 앵커 생성 플로우 처리 시 사용.
 * @connects services/visual/anchorApi.js, store/useProjectStore.js
 * @doc docs/04-visual-factory.md (앵커 선택)
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { generateAnchorCandidatesStream, confirmAnchor, uploadAnchorCandidate, generatePulidAnchorCandidatesStream } from '../../../services/visual/anchorApi.js'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'

export default function useAnchorGeneration(projectId, assetId) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState(null)
  const [candidates, setCandidates] = useState([])
  const abortCtrlRef = useRef(null)

  const setAnchorCandidates = useProjectStore((s) => s.setAnchorCandidates)
  const selectAnchor = useProjectStore((s) => s.selectAnchor)
  const updateAsset = useProjectStore((s) => s.updateAsset)
  const getProject = useProjectStore((s) => s.getProject)

  useEffect(() => {
    const asset = getProject(projectId)?.assets?.find((a) => a.asset_id === assetId)
    const saved = asset?.anchor_candidates ?? []
    setCandidates(saved)
  }, [projectId, assetId, getProject])

  const generate = useCallback(async (prompt, count = 5, file = null, weight = 0.8) => {
    const project = getProject(projectId)
    const visualStyle = project?.visual_style || 'PHOTOREALISTIC'
    const asset = project?.assets?.find((a) => a.asset_id === assetId)
    const assetType = asset?.asset_type || 'CHARACTER'

    const ctrl = new AbortController()
    abortCtrlRef.current = ctrl
    setIsGenerating(true)
    setError(null)
    setCandidates([])

    const collected = []
    try {
      const stream = file
        ? generatePulidAnchorCandidatesStream({ projectId, assetId, assetType, appearancePrompt: prompt, file, count, weight, visualStyle, signal: ctrl.signal })
        : generateAnchorCandidatesStream({ projectId, assetId, assetType, appearancePrompt: prompt, count, visualStyle, signal: ctrl.signal })

      for await (const candidate of stream) {
        if (ctrl.signal.aborted) break
        collected.push(candidate)
        setCandidates([...collected])
      }
      if (!ctrl.signal.aborted) {
        setAnchorCandidates(projectId, assetId, collected)
      }
      return ctrl.signal.aborted ? null : collected
    } catch (err) {
      logError('useAnchorGeneration.generate', err, { projectId, assetId, count, hasFile: Boolean(file) })
      if (err.name !== 'AbortError') {
        setError(err.message ?? '앵커 생성 실패')
      }
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [projectId, assetId, getProject, setAnchorCandidates])

  const upload = useCallback(async (file) => {
    setIsUploading(true)
    setError(null)
    try {
      const candidate = await uploadAnchorCandidate({ projectId, assetId, file, index: candidates.length })
      const newCandidates = [...candidates, candidate]
      setCandidates(newCandidates)
      setAnchorCandidates(projectId, assetId, newCandidates)
      return candidate
    } catch (err) {
      logError('useAnchorGeneration.upload', err, { projectId, assetId, nextIndex: candidates.length })
      setError(err.message ?? '이미지 업로드 실패')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [projectId, assetId, candidates, setAnchorCandidates])

  const stop = useCallback(async () => {
    abortCtrlRef.current?.abort()
    setIsGenerating(false)
    try {
      await fetch('/api/visual/comfyui/interrupt', { method: 'POST' })
    } catch (err) {
      logError('useAnchorGeneration.stop', err, { projectId, assetId })
    }
  }, [projectId, assetId])

  const confirm = useCallback(async (candidateImageId) => {
    setIsConfirming(true)
    setError(null)
    try {
      const data = await confirmAnchor({ projectId, assetId, candidateImageId })
      selectAnchor(projectId, assetId, data)
      return data
    } catch (err) {
      logError('useAnchorGeneration.confirm', err, { projectId, assetId, candidateImageId })
      setError(err.message ?? '앵커 확정 실패')
      return null
    } finally {
      setIsConfirming(false)
    }
  }, [projectId, assetId, selectAnchor])

  const savePrompt = useCallback((prompt) => {
    updateAsset(projectId, assetId, { appearance_prompt: prompt })
  }, [projectId, assetId, updateAsset])

  return { isGenerating, isUploading, isConfirming, error, candidates, generate, upload, confirm, savePrompt, stop }
}
