/**
 * @file LoraCompletePage.jsx
 * @description 3-d: LoRA 학습 완료 페이지. 결과 요약 + 다음 에셋으로 이동.
 * @usage /project/:id/visual/:assetId/complete 라우트에서 렌더링.
 * @connects CompletionSummary, store/useProjectStore.js
 * @doc docs/04-visual-factory.md (LoRA 완료)
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLoraStatus, cancelLoraTraining, deleteLoRA } from '../../../services/visual/loraApi.js'
import { logError } from '../../../shared/utils/logger.js'
import useProjectStore from '../../../store/useProjectStore.js'
import CompletionSummary from '../components/lora/CompletionSummary.jsx'

const POLL_INTERVAL_MS = 2000
const EMPTY_ASSETS = []

function TrainingStatusCard({ progress, status, stepValue, stepMax, trainingImages, triggerWord, onCancel, cancelling }) {
  const progressPct = Math.round((progress ?? 0) * 100)
  const statusLabel = status === 'queued' ? 'Queued' : 'Training'

  return (
    <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">LoRA 학습 진행 중</h2>
        <p className="mt-1 text-sm text-slate-400">
          학습이 완료되면 자동으로 결과가 표시됩니다.
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div>
            <span>{statusLabel}</span>
            {stepMax > 0 && (
              <span className="ml-2 tabular-nums">Step {stepValue} / {stepMax}</span>
            )}
          </div>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-teal-500 transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-800/60 px-3 py-2.5">
          <div className="text-xs text-slate-500">Trigger word</div>
          <div className="mt-1 text-sm font-medium text-slate-200">{triggerWord || '-'}</div>
        </div>
        <div className="rounded-lg bg-slate-800/60 px-3 py-2.5">
          <div className="text-xs text-slate-500">Training images</div>
          <div className="mt-1 text-sm font-medium text-slate-200">{trainingImages ?? '-'}</div>
        </div>
      </div>
      <button
        disabled={cancelling}
        onClick={onCancel}
        className="w-full rounded-lg border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
      >
        {cancelling ? '중지 중...' : '학습 중지'}
      </button>
    </div>
  )
}

export default function LoraCompletePage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const fetchProjectDetail = useProjectStore((s) => s.fetchProjectDetail)
  const completeLoraTraining = useProjectStore((s) => s.completeLoraTraining)
  const resetLoraAsset = useProjectStore((s) => s.resetLoraAsset)
  const asset = project?.assets?.find((a) => a.asset_id === assetId)

  const [taskStatus, setTaskStatus] = useState(asset?.pipeline_status === 'LORA_TRAINED' ? 'done' : null)
  const [taskProgress, setTaskProgress] = useState(asset?.pipeline_status === 'LORA_TRAINED' ? 1 : 0)
  const [stepValue, setStepValue] = useState(0)
  const [stepMax, setStepMax] = useState(0)
  const [taskError, setTaskError] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const taskId = asset?.lora_result?.task_id ?? null
  const assets = project?.assets ?? EMPTY_ASSETS
  const nextAsset = useMemo(
    () => assets.find((candidate) => candidate.asset_id !== assetId && candidate.pipeline_status !== 'LORA_TRAINED'),
    [assetId, assets]
  )
  const allDone = assets.length > 0 && assets.every((candidate) => candidate.pipeline_status === 'LORA_TRAINED')
  const isCompleted = asset?.pipeline_status === 'LORA_TRAINED'
  const isTraining = asset?.pipeline_status === 'LORA_TRAINING'

  useEffect(() => {
    if (!asset || !taskId || !isTraining) {
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
            training_images: data.training_image_count ?? asset?.lora_result?.training_images,
            steps: 100,
          })
          await fetchProjectDetail(id)
          return
        }

        if (data.status === 'error') {
          await fetchProjectDetail(id)
          return
        }
      } catch (err) {
        logError('LoraCompletePage.poll', err, { projectId: id, assetId, taskId })
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
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        에셋을 찾을 수 없습니다.
      </div>
    )
  }

  // 다음 미완료 에셋 찾기
  return (
    <div className="max-w-2xl space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/project/${id}/visual`)}
          className="text-slate-500 transition-colors hover:text-slate-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-slate-100">LoRA 학습 완료</h1>
      </div>

      {/* 완료 결과 카드 */}
      {isTraining && (
        <TrainingStatusCard
          progress={taskProgress}
          status={taskStatus}
          stepValue={stepValue}
          stepMax={stepMax}
          trainingImages={asset.lora_result?.training_images}
          triggerWord={asset.lora_result?.trigger_word}
          cancelling={cancelling}
          onCancel={async () => {
            setCancelling(true)
            try {
              await cancelLoraTraining(taskId)
              await fetchProjectDetail(id)
            } catch (err) {
              setTaskError(err.message)
            } finally {
              setCancelling(false)
            }
          }}
        />
      )}

      {taskError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {taskError}
        </div>
      )}

      {isCompleted && <CompletionSummary loraResult={asset.lora_result} assetName={asset.display_name} />}

      {/* LoRA 삭제 및 재학습 */}
      {isCompleted && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 space-y-3">
          <p className="text-xs text-slate-500">
            LoRA 모델을 삭제하고 처음부터 다시 학습할 수 있습니다. 삭제 후 파생 이미지 선택 단계로 돌아갑니다.
          </p>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="w-full rounded-lg border border-orange-500/30 bg-orange-500/10 py-2 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/20"
            >
              LoRA 삭제 후 재학습
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-orange-300 font-medium">정말 삭제하시겠습니까? 학습된 LoRA가 영구 삭제됩니다.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true)
                    try {
                      await deleteLoRA(assetId)
                      resetLoraAsset(id, assetId)
                      navigate(`/project/${id}/visual/${assetId}/derived`)
                    } catch (err) {
                      logError('LoraCompletePage.delete', err, { projectId: id, assetId })
                      setDeleteConfirm(false)
                    } finally {
                      setDeleting(false)
                    }
                  }}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting ? '삭제 중...' : '삭제 확인'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 전체 완료 메시지 */}
      {isCompleted && allDone && (
        <div className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-center text-sm text-teal-300">
          모든 에셋의 LoRA 학습이 완료되었습니다. 에피소드 제작을 시작할 수 있습니다.
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/project/${id}/visual`)}
          className="flex-1 rounded-lg bg-slate-700 py-3 font-medium text-slate-200 transition-colors hover:bg-slate-600"
        >
          에셋 목록으로
        </button>
        {isCompleted && nextAsset && (
          <button
            onClick={() => navigate(`/project/${id}/visual/${nextAsset.asset_id}/anchor`)}
            className="flex-1 rounded-lg bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500"
          >
            다음 에셋: {nextAsset.display_name} →
          </button>
        )}
      </div>
    </div>
  )
}
