/**
 * @file useDerivedGeneration.js
 * @description 파생 이미지 생성 + 필터 트리거 훅.
 * SSE 스트리밍으로 이미지가 하나씩 완성될 때마다 스토어에 누적.
 * @usage DerivedImagesPage에서 파생 생성 플로우 처리 시 사용.
 * @connects services/visual/derivedApi.js, store/useProjectStore.js
 * @doc docs/04-visual-factory.md (파생 이미지 생성)
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { generateDerivedStream, filterDerived } from '../../../services/visual/derivedApi.js'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'

export default function useDerivedGeneration(projectId, assetId) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)
  const [error, setError] = useState(null)
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)
  const abortCtrlRef = useRef(null)

  const getProject = useProjectStore((s) => s.getProject)
  const setDerivedImages = useProjectStore((s) => s.setDerivedImages)
  const requiresFaceFilter = (assetType) => assetType === 'CHARACTER' || assetType === 'NPC'

  useEffect(() => {
    if (!error) return
    logError('useDerivedGeneration.error', new Error(error), { projectId, assetId })
  }, [error, projectId, assetId])

  const generate = useCallback(async (targetPresets = null) => {
    const asset = getProject(projectId)?.assets?.find((a) => a.asset_id === assetId)
    if (!asset?.anchor_image) {
      setError('앵커 이미지가 없습니다. 앵커를 먼저 확정하세요.')
      return null
    }

    const ctrl = new AbortController()
    abortCtrlRef.current = ctrl
    setIsGenerating(true)
    setError(null)
    setCompleted(0)
    setTotal(0)

    // 새 생성 시작 시 기존 이미지 클리어 또는 부분 유지
    const existingImages = targetPresets ? [...(asset.derived_images || [])] : []
    if (!targetPresets) {
      setDerivedImages(projectId, assetId, [], 'NONE')
    }

    try {
      for await (const event of generateDerivedStream({
        projectId,
        assetId,
        assetType: asset.asset_type,
        anchorImageId: asset.anchor_image.image_id,
        appearancePrompt: asset.appearance_prompt ?? '',
        targetPresets,
        signal: ctrl.signal,
      })) {
        if (ctrl.signal.aborted) break

        if (event.type === 'total') {
          setTotal(event.total)
        } else if (event.type === 'image') {
          const { type: _type, ...newImage } = event
          
          const existingIdx = existingImages.findIndex(img => img.preset_key === newImage.preset_key)
          if (existingIdx !== -1) {
            existingImages[existingIdx] = newImage
          } else {
            existingImages.push(newImage)
          }

          // 이미지 하나씩 스토어에 누적 → UI 실시간 반영
          setDerivedImages(projectId, assetId, [...existingImages], 'DERIVED_GENERATING')
          setCompleted((prev) => prev + 1)
        }
      }

      if (!ctrl.signal.aborted) {
        setDerivedImages(projectId, assetId, existingImages, 'DERIVED_GENERATED')
      }
      return ctrl.signal.aborted ? null : existingImages
    } catch (err) {
      logError('useDerivedGeneration.generate', err, { projectId, assetId, targetPresetsCount: targetPresets?.length ?? 0 })
      if (err.name !== 'AbortError') {
        setError(err.message ?? '파생 이미지 생성 실패')
      }
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [projectId, assetId, getProject, setDerivedImages])

  const stop = useCallback(async () => {
    abortCtrlRef.current?.abort()
    setIsGenerating(false)
    try {
      await fetch('/api/visual/comfyui/interrupt', { method: 'POST' })
    } catch (err) {
      logError('useDerivedGeneration.stop', err, { projectId, assetId })
      // 인터럽트 실패는 무시
    }
  }, [projectId, assetId])

  const filter = useCallback(async () => {
    const asset = getProject(projectId)?.assets?.find((a) => a.asset_id === assetId)
    if (!asset?.derived_images?.length) {
      setError('필터링에 필요한 데이터가 없습니다.')
      return null
    }
    if (requiresFaceFilter(asset.asset_type) && !asset?.anchor_embedding) {
      setError('?듭빱 ?쇨뎬 ?꾨쿋??놁뒿?덈떎. ?쇨뎬??보이는 앵커를 다시 선택하세요.')
      return null
    }

    setIsFiltering(true)
    setError(null)

    try {
      const data = await filterDerived({
        projectId,
        assetId,
        assetType: asset.asset_type,
        anchorEmbedding: asset.anchor_embedding,
        images: asset.derived_images,
      })
      setDerivedImages(projectId, assetId, data.images, 'DERIVED_FILTERED')
      return data
    } catch (err) {
      setError(err.message ?? '필터링 실패')
      return null
    } finally {
      setIsFiltering(false)
    }
  }, [projectId, assetId, getProject, setDerivedImages])

  return { isGenerating, isFiltering, error, completed, total, generate, filter, stop }
}
