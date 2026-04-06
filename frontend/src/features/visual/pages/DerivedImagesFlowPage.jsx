/**
 * @file DerivedImagesFlowPage.jsx
 * @description Handles derived image generation, filtering, and LoRA training entry with clean gating.
 * @usage Routed from /project/:id/visual/:assetId/derived.
 * @connects useDerivedGeneration, useComfyUIQueue, services/visual/loraApi.js, store/useProjectStore.js
 * @doc docs/04-visual-factory.md
 */
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { startLoraTraining } from '../../../services/visual/loraApi.js'
import { logError } from '../../../shared/utils/logger.js'
import useProjectStore from '../../../store/useProjectStore.js'
import { ImageSection, StatusPanel } from '../components/derived/DerivedImagesFlowSections.jsx'
import useComfyUIQueue from '../hooks/useComfyUIQueue.js'
import useDerivedGeneration from '../hooks/useDerivedGeneration.js'

const EMPTY_LIST = []

export default function DerivedImagesFlowPage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const setLoraTraining = useProjectStore((s) => s.setLoraTraining)
  const asset = project?.assets?.find((candidate) => candidate.asset_id === assetId)

  const [selectedPresets, setSelectedPresets] = useState([])
  const [isStartingLora, setIsStartingLora] = useState(false)
  const [loraError, setLoraError] = useState(null)

  const { isGenerating, isFiltering, error, completed, total, generate, filter, stop } = useDerivedGeneration(id, assetId)
  const { queue, progress, progressPct, wsConnected } = useComfyUIQueue(isGenerating)

  const images = asset?.derived_images ?? EMPTY_LIST
  const isFiltered =
    asset?.pipeline_status === 'DERIVED_FILTERED'
    || asset?.pipeline_status === 'LORA_TRAINING'
    || asset?.pipeline_status === 'LORA_TRAINED'

  const trainableImageIds = useMemo(
    () => images.filter((image) => image.filter_result === 'PASS' || image.filter_result === 'SKIP').map((image) => image.image_id),
    [images]
  )
  const categoryGroups = useMemo(() => {
    const groups = new Map()
    for (const image of images) {
      const key = image.category || 'Other'
      const existing = groups.get(key) ?? []
      existing.push(image)
      groups.set(key, existing)
    }
    return Array.from(groups.entries())
  }, [images])
  const filterCounts = useMemo(
    () => ({
      pass: images.filter((image) => image.filter_result === 'PASS').length,
      fail: images.filter((image) => image.filter_result === 'FAIL').length,
      skip: images.filter((image) => image.filter_result === 'SKIP').length,
    }),
    [images]
  )

  if (!asset) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Asset not found.</div>
  }

  const canStartLora = asset.pipeline_status === 'DERIVED_FILTERED' && trainableImageIds.length > 0
  const hasLoraRun = asset.pipeline_status === 'LORA_TRAINING' || asset.pipeline_status === 'LORA_TRAINED'

  async function handleStartLora() {
    if (asset.pipeline_status !== 'DERIVED_FILTERED') {
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
      logError('DerivedImagesFlowPage.handleStartLora', err, { projectId: id, assetId })
      setLoraError(err.message ?? 'Failed to start LoRA training.')
    } finally {
      setIsStartingLora(false)
    }
  }

  return (
    <div className="max-w-5xl space-y-6 p-6">
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
          <p className="mt-1 text-sm text-slate-400">Generate variants, run the filter, then start LoRA with approved images only.</p>
        </div>
      </div>

      {asset.anchor_image && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <img src={asset.anchor_image.image_url} alt="Anchor" className="h-14 w-14 rounded-lg object-cover" />
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Anchor image</div>
            <div className="mt-1 text-sm text-slate-200">Derived filtering and LoRA training use this anchor as the source of truth.</div>
          </div>
        </div>
      )}

      {images.length === 0 && !isGenerating && (
        <button
          onClick={() => generate()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500"
        >
          Generate derived images
        </button>
      )}

      {isGenerating && (
        <div className="space-y-3">
          <StatusPanel
            queue={queue}
            progress={progress}
            progressPct={progressPct}
            wsConnected={wsConnected}
            completed={completed}
            total={total}
          />
          <button
            onClick={stop}
            className="w-full rounded-xl border border-red-500/30 bg-red-600/15 py-2.5 font-medium text-red-300 transition-colors hover:bg-red-600/25"
          >
            Stop generation
          </button>
        </div>
      )}

      {(error || loraError) && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error || loraError}
        </div>
      )}

      {categoryGroups.length > 0 && (
        <div className="space-y-6">
          {categoryGroups.map(([category, groupImages]) => (
            <ImageSection
              key={category}
              category={category}
              images={groupImages}
              selectedPresets={selectedPresets}
              onToggleSelection={(presetKey) => {
                setSelectedPresets((current) => (
                  current.includes(presetKey)
                    ? current.filter((value) => value !== presetKey)
                    : [...current, presetKey]
                ))
              }}
            />
          ))}
        </div>
      )}

      {isFiltered && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm">
          <span className="text-slate-400">Filter summary</span>
          <span className="text-green-300">PASS {filterCounts.pass}</span>
          <span className="text-red-300">FAIL {filterCounts.fail}</span>
          <span className="text-yellow-300">SKIP {filterCounts.skip}</span>
          <span className="ml-auto text-slate-500">Trainable {trainableImageIds.length}</span>
        </div>
      )}

      {images.length > 0 && !isGenerating && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => {
                setSelectedPresets([])
                generate()
              }}
              className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-600"
            >
              Regenerate all
            </button>
            <button
              onClick={() => {
                generate(selectedPresets)
                setSelectedPresets([])
              }}
              disabled={selectedPresets.length === 0}
              className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              Regenerate selected {selectedPresets.length > 0 ? `(${selectedPresets.length})` : ''}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {!isFiltered && (
              <button
                onClick={filter}
                disabled={isFiltering}
                className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isFiltering ? 'Filtering...' : 'Run filter'}
              </button>
            )}

            {!hasLoraRun ? (
              <button
                onClick={handleStartLora}
                disabled={isStartingLora || !canStartLora}
                className="rounded-xl bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
              >
                {isStartingLora ? 'Starting LoRA...' : 'Start LoRA training'}
              </button>
            ) : (
              <button
                onClick={() => navigate(`/project/${id}/visual/${assetId}/complete`)}
                className="rounded-xl bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500"
              >
                View LoRA status
              </button>
            )}
          </div>

          {!canStartLora && asset.pipeline_status === 'DERIVED_FILTERED' && (
            <p className="text-sm text-slate-500">LoRA training requires at least one PASS or SKIP image.</p>
          )}
        </div>
      )}
    </div>
  )
}
