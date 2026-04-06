/**
 * @file useAutoAnchor.js
 * @description 신규 에셋에 대해 앵커 이미지를 자동 생성하는 훅. 에피소드 Chain 2 이후 실행.
 * @usage NewAssetAnchorReview.jsx에서 사용.
 * @connects services/visual/anchorApi.js, store/useProjectStore.js
 * @doc docs/04-visual-factory.md (앵커 선택)
 */
import { useState, useCallback } from 'react'
import { generateAnchorCandidatesStream, confirmAnchor } from '../../../services/visual/anchorApi.js'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'

export default function useAutoAnchor(projectId) {
  // { [assetId]: { generating, candidate, confirmed, error } }
  const [anchorStates, setAnchorStates] = useState({})
  const selectAnchor = useProjectStore((s) => s.selectAnchor)

  const generate = useCallback(async (asset) => {
    if (!asset.appearance_prompt) return
    setAnchorStates((prev) => ({
      ...prev,
      [asset.asset_id]: { generating: true, candidate: null, confirmed: false, error: null },
    }))
    try {
      const stream = generateAnchorCandidatesStream({
        projectId,
        assetId: asset.asset_id,
        assetType: asset.asset_type,
        appearancePrompt: asset.appearance_prompt,
        count: 1,
        visualStyle: 'PHOTOREALISTIC',
      })
      let last = null
      for await (const candidate of stream) {
        last = candidate
      }
      setAnchorStates((prev) => ({
        ...prev,
        [asset.asset_id]: { generating: false, candidate: last, confirmed: false, error: null },
      }))
    } catch (err) {
      logError('useAutoAnchor.generate', err, { projectId, assetId: asset.asset_id })
      setAnchorStates((prev) => ({
        ...prev,
        [asset.asset_id]: { generating: false, candidate: null, confirmed: false, error: err.message },
      }))
    }
  }, [projectId])

  const refresh = useCallback((asset) => generate(asset), [generate])

  const confirm = useCallback(async (assetId) => {
    const state = anchorStates[assetId]
    if (!state?.candidate?.image_id) {
      setAnchorStates((prev) => ({
        ...prev,
        [assetId]: { ...prev[assetId], confirmed: true },
      }))
      return
    }
    try {
      const data = await confirmAnchor({ projectId, assetId, candidateImageId: state.candidate.image_id })
      selectAnchor(projectId, assetId, data)
      setAnchorStates((prev) => ({
        ...prev,
        [assetId]: { ...prev[assetId], confirmed: true },
      }))
    } catch (err) {
      logError('useAutoAnchor.confirm', err, { projectId, assetId })
      setAnchorStates((prev) => ({
        ...prev,
        [assetId]: { ...prev[assetId], confirmed: true, error: err.message },
      }))
    }
  }, [projectId, anchorStates, selectAnchor])

  const skip = useCallback((assetId) => {
    setAnchorStates((prev) => ({
      ...prev,
      [assetId]: { ...(prev[assetId] || {}), confirmed: true },
    }))
  }, [])

  return { anchorStates, generate, refresh, confirm, skip }
}
