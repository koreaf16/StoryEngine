/**
 * @file LoraTrainingStatusPage.jsx
 * @description Polls backend LoRA task status and shows queued, training, failed, or completed states.
 * @usage Routed from /project/:id/visual/:assetId/complete after LoRA training starts.
 * @connects services/visual/loraApi.js, store/useProjectStore.js
 * @doc docs/04-visual-factory.md
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLoraStatus, cancelLoraTraining } from '../../../services/visual/loraApi.js'
import { logError } from '../../../shared/utils/logger.js'
import useProjectStore from '../../../store/useProjectStore.js'

const POLL_INTERVAL_MS = 2000
const EMPTY_LIST = []

function SummaryCard({ assetName, loraResult }) {
  const rows = [
    { label: 'Trigger word', value: loraResult?.trigger_word || '-' },
    { label: 'Training images', value: loraResult?.training_images ?? '-' },
    { label: 'LoRA file', value: loraResult?.lora_path || loraResult?.lora_filename || '-' },
  ]

  return (
    <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{assetName} LoRA ready</h2>
        <p className="mt-1 text-sm text-slate-400">The persisted LoRA metadata is now available in the project payload.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-slate-800/70 px-3 py-2.5">
            <div className="text-xs text-slate-500">{row.label}</div>
            <div className="mt-1 break-all text-sm font-medium text-slate-100">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LoraTrainingStatusPage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const fetchProjectDetail = useProjectStore((s) => s.fetchProjectDetail)
  const completeLoraTraining = useProjectStore((s) => s.completeLoraTraining)
  const asset = project?.assets?.find((candidate) => candidate.asset_id === assetId)

  const [taskStatus, setTaskStatus] = useState(asset?.pipeline_status === 'LORA_TRAINED' ? 'done' : null)
  const [taskProgress, setTaskProgress] = useState(asset?.pipeline_status === 'LORA_TRAINED' ? 1 : 0)
  const [stepValue, setStepValue] = useState(0)
  const [stepMax, setStepMax] = useState(0)
  const [taskError, setTaskError] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const assets = project?.assets ?? EMPTY_LIST
  const nextAsset = useMemo(
    () => assets.find((candidate) => candidate.asset_id !== assetId && candidate.pipeline_status !== 'LORA_TRAINED'),
    [assetId, assets]
  )

  const taskId = asset?.lora_result?.task_id ?? null
  const isTraining = asset?.pipeline_status === 'LORA_TRAINING'
  const isCompleted = asset?.pipeline_status === 'LORA_TRAINED'
  const allDone = assets.length > 0 && assets.every((candidate) => candidate.pipeline_status === 'LORA_TRAINED')
  const progressPct = Math.round((taskProgress ?? 0) * 100)

  useEffect(() => {
    if (!taskId || !isTraining) {
      return undefined
    }

    let cancelled = false
    let timeoutId = null

    const poll = async () => {
      try {
        const data = await getLoraStatus(taskId)
        if (cancelled) return

        setTaskStatus(data.status)
        setTaskProgress(data.progress ?? 0)
        if (data.step_value > 0) setStepValue(data.step_value)
        if (data.step_max > 0) setStepMax(data.step_max)
        setTaskError(data.error ?? null)

        if (data.status === 'cancelled') {
          await fetchProjectDetail(id)
          return
        }

        if (data.status === 'done') {
          completeLoraTraining(id, assetId, {
            task_id: data.task_id,
            status: data.status,
            trigger_word: data.trigger_word,
            lora_filename: data.lora_filename,
            lora_path: data.lora_path,
            training_images: data.training_image_count ?? asset.lora_result?.training_images,
            steps: 100,
          })
          await fetchProjectDetail(id)
          return
        }

        if (data.status === 'error') {
          setTaskError(data.error ?? 'LoRA training failed.')
          await fetchProjectDetail(id)
          return
        }
      } catch (err) {
        logError('LoraTrainingStatusPage.poll', err, { projectId: id, assetId, taskId })
        if (cancelled) return
        setTaskError(err.message ?? 'Failed to refresh LoRA training status.')
      }

      if (!cancelled) {
        timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    poll()

    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [asset, assetId, completeLoraTraining, fetchProjectDetail, id, isTraining, taskId])

  if (!asset) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Asset not found.</div>
  }

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/project/${id}/visual`)}
          className="text-slate-500 transition-colors hover:text-slate-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">LoRA training status</h1>
          <p className="mt-1 text-sm text-slate-400">{asset.display_name}</p>
        </div>
      </div>

      {isTraining && (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-slate-300">{taskStatus === 'queued' ? 'Queued' : 'Training'}</span>
              {stepMax > 0 && (
                <span className="ml-2 tabular-nums text-slate-500">
                  Step {stepValue} / {stepMax}
                </span>
              )}
            </div>
            <span className="tabular-nums text-sm text-slate-400">{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-800/70 px-3 py-2.5">
              <div className="text-xs text-slate-500">Trigger word</div>
              <div className="mt-1 text-sm font-medium text-slate-100">{asset.lora_result?.trigger_word || '-'}</div>
            </div>
            <div className="rounded-lg bg-slate-800/70 px-3 py-2.5">
              <div className="text-xs text-slate-500">Training images</div>
              <div className="mt-1 text-sm font-medium text-slate-100">{asset.lora_result?.training_images ?? '-'}</div>
            </div>
          </div>
          <button
            disabled={cancelling}
            onClick={async () => {
              setCancelling(true)
              try {
                await cancelLoraTraining(taskId)
                await fetchProjectDetail(id)
              } catch (err) {
                logError('LoraTrainingStatusPage.cancel', err, { taskId })
                setTaskError(err.message)
              } finally {
                setCancelling(false)
              }
            }}
            className="w-full rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            {cancelling ? '중지 중...' : '학습 중지'}
          </button>
        </div>
      )}

      {taskError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {taskError}
        </div>
      )}

      {isCompleted && <SummaryCard assetName={asset.display_name} loraResult={asset.lora_result} />}

      {isCompleted && allDone && (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-center text-sm text-teal-300">
          All assets have finished LoRA training.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => navigate(`/project/${id}/visual`)}
          className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-600"
        >
          Back to assets
        </button>

        {taskError ? (
          <button
            onClick={() => navigate(`/project/${id}/visual/${assetId}/derived`)}
            className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-600"
          >
            Back to derived images
          </button>
        ) : isCompleted && nextAsset ? (
          <button
            onClick={() => navigate(`/project/${id}/visual/${nextAsset.asset_id}/anchor`)}
            className="rounded-xl bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500"
          >
            Next asset: {nextAsset.display_name}
          </button>
        ) : null}
      </div>
    </div>
  )
}
