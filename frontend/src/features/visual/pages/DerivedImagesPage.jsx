/**
 * @file DerivedImagesPage.jsx
 * @description Derived image generation, filtering, and LoRA training page.
 * @usage Routed from /project/:id/visual/:assetId/derived.
 * @connects useDerivedGeneration, useComfyUIQueue, services/visual/loraApi.js, store/useProjectStore.js
 * @doc docs/04-visual-factory.md
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import useDerivedGeneration from '../hooks/useDerivedGeneration.js'
import useComfyUIQueue from '../hooks/useComfyUIQueue.js'
import DerivedCategoryGroup from '../components/derived/DerivedCategoryGroup.jsx'
import ComfyUIQueueStatus from '../components/anchor/ComfyUIQueueStatus.jsx'
import PipelineProgressBar from '../components/derived/PipelineProgressBar.jsx'
import FilterSummary from '../components/derived/FilterSummary.jsx'
import { startLoraTraining, recoverLora } from '../../../services/visual/loraApi.js'

const EMPTY_IMAGES = []

export default function DerivedImagesPage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const setLoraTraining = useProjectStore((s) => s.setLoraTraining)
  const completeLoraTraining = useProjectStore((s) => s.completeLoraTraining)
  const asset = project?.assets?.find((candidate) => candidate.asset_id === assetId)

  const [isStartingLora, setIsStartingLora] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const [loraError, setLoraError] = useState(null)
  const [selectedPresets, setSelectedPresets] = useState([])

  const { isGenerating, isFiltering, error, completed, total, generate, filter, stop } = useDerivedGeneration(id, assetId)
  const { queue, progress, progressPct, wsConnected } = useComfyUIQueue(isGenerating)

  const images = asset?.derived_images ?? EMPTY_IMAGES
  const isFiltered =
    asset?.pipeline_status === 'DERIVED_FILTERED'
    || asset?.pipeline_status === 'LORA_TRAINING'
    || asset?.pipeline_status === 'LORA_TRAINED'

  const categoryGroups = useMemo(() => {
    const groups = {}
    for (const image of images) {
      const category = image.category ?? 'Other'
      if (!groups[category]) groups[category] = []
      groups[category].push(image)
    }
    return groups
  }, [images])

  const filterStats = useMemo(() => ({
    pass: images.filter((image) => image.filter_result === 'PASS').length,
    fail: images.filter((image) => image.filter_result === 'FAIL').length,
    skip: images.filter((image) => image.filter_result === 'SKIP').length,
  }), [images])

  const trainableImageIds = useMemo(() => (
    images
      .filter((image) => image.filter_result === 'PASS' || image.filter_result === 'SKIP')
      .map((image) => image.image_id)
  ), [images])

  const canStartLora = asset?.pipeline_status === 'DERIVED_FILTERED' && trainableImageIds.length > 0

  const toggleSelection = useCallback((presetKey) => {
    setSelectedPresets((prev) => (
      prev.includes(presetKey)
        ? prev.filter((key) => key !== presetKey)
        : [...prev, presetKey]
    ))
  }, [])

  async function handleRecover() {
    setIsRecovering(true)
    setLoraError(null)
    try {
      const data = await recoverLora({ projectId: id, assetId })
      completeLoraTraining(id, assetId, {
        status: 'done',
        trigger_word: data.trigger_word,
        lora_filename: data.lora_filename,
        lora_path: data.lora_path,
      })
      navigate(`/project/${id}/visual/${assetId}/complete`)
    } catch (err) {
      logError('DerivedImagesPage.handleRecover', err, { projectId: id, assetId })
      setLoraError('ComfyUI output에서 LoRA 파일을 찾을 수 없습니다.')
    } finally {
      setIsRecovering(false)
    }
  }

  async function handleStartLora() {
    if (asset?.pipeline_status !== 'DERIVED_FILTERED') {
      setLoraError('Run the derived-image filter before starting LoRA training.')
      return
    }
    if (trainableImageIds.length === 0) {
      setLoraError('No PASS or SKIP images are available for LoRA training.')
      return
    }

    setIsStartingLora(true)
    setLoraError(null)

    try {
      const data = await startLoraTraining({
        projectId: id,
        assetId,
        assetName: asset.display_name,
        passedImageIds: trainableImageIds,
      })

      setLoraTraining(id, assetId, {
        task_id: data.task_id,
        status: data.status,
        trigger_word: data.trigger_word,
        lora_filename: data.lora_filename,
        training_images: data.training_image_count,
      })

      navigate(`/project/${id}/visual/${assetId}/complete`)
    } catch (err) {
      logError('DerivedImagesPage.handleStartLora', err, { projectId: id, assetId })
      setLoraError(err.message ?? 'Failed to start LoRA training.')
    } finally {
      setIsStartingLora(false)
    }
  }

  if (!asset) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Asset not found.</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/project/${id}/visual/${assetId}/anchor`)}
          className="text-slate-500 transition-colors hover:text-slate-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{asset.display_name} derived images</h1>
          <p className="mt-0.5 text-sm text-slate-400">Generate variants, run the filter, then start LoRA training.</p>
        </div>
      </div>

      {asset.anchor_image && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="h-12 w-12 overflow-hidden rounded-lg flex-shrink-0">
            <img src={asset.anchor_image.image_url} alt="Anchor" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Anchor image</div>
            <div className="mt-0.5 text-sm text-slate-200">Derived filtering and LoRA training use this anchor as the source of truth.</div>
          </div>
        </div>
      )}

      {images.length === 0 && !isGenerating && (
        <button
          onClick={() => generate()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500"
        >
          Generate derived images
        </button>
      )}

      {isGenerating && (
        <div className="space-y-3">
          <PipelineProgressBar
            completed={completed}
            total={total || 1}
            label="Generating derived images..."
          />
          <ComfyUIQueueStatus queue={queue} progress={progress} progressPct={progressPct} wsConnected={wsConnected} />
          <button
            onClick={stop}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-600/15 py-2.5 font-medium text-red-400 transition-colors hover:bg-red-600/25"
          >
            Stop generation
          </button>
        </div>
      )}

      {(error || loraError) && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error || loraError}
        </div>
      )}

      {Object.keys(categoryGroups).length > 0 && (
        <div className="space-y-6">
          {Object.entries(categoryGroups).map(([category, groupImages]) => (
            <DerivedCategoryGroup
              key={category}
              categoryName={category}
              images={groupImages}
              selectedPresets={selectedPresets}
              onToggleSelection={toggleSelection}
            />
          ))}
        </div>
      )}

      {isFiltered && (
        <FilterSummary
          passCount={filterStats.pass}
          failCount={filterStats.fail}
          skipCount={filterStats.skip}
        />
      )}

      {images.length > 0 && !isGenerating && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button
              onClick={() => generate(selectedPresets.length > 0 ? selectedPresets : null)}
              disabled={isGenerating}
              className="flex-1 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              Regenerate selected
            </button>
            <button
              onClick={() => filter()}
              disabled={isFiltering}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-3 font-medium text-slate-200 transition-colors hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFiltering ? 'Filtering...' : 'Run filter'}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartLora}
              disabled={!canStartLora || isStartingLora || isRecovering}
              className="flex-1 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isStartingLora ? 'Starting LoRA...' : 'Start LoRA training'}
            </button>
            <button
              onClick={handleRecover}
              disabled={!canStartLora || isRecovering || isStartingLora}
              title="ComfyUI output에 이미 학습된 파일이 있으면 가져옵니다"
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRecovering ? '가져오는 중...' : '파일 가져오기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
