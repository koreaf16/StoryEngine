/**
 * @file DerivedImagesFlowPage.jsx
 * @description 파생 이미지 생성 및 필터링 워크플로우 페이지. (Kohya-ss 연동 추가)
 */
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { ImageSection, StatusPanel } from '../components/derived/DerivedImagesFlowSections.jsx'
import useComfyUIQueue from '../hooks/useComfyUIQueue.js'
import useDerivedGeneration from '../hooks/useDerivedGeneration.js'
import { prepareLoraTraining } from '../../../services/visual/loraApi.js'
import { logError } from '../../../shared/utils/logger.js'

const EMPTY_LIST = []

export default function DerivedImagesFlowPage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const asset = project?.assets?.find((candidate) => candidate.asset_id === assetId)

  const [selectedPresets, setSelectedPresets] = useState([])
  const [isPreparingLora, setIsPreparingLora] = useState(false)
  const [loraError, setLoraError] = useState(null)

  const { isGenerating, isFiltering, error, completed, total, generate, filter, stop } = useDerivedGeneration(id, assetId)
  const { queue, progress, progressPct, wsConnected } = useComfyUIQueue(isGenerating)

  const images = asset?.derived_images ?? EMPTY_LIST
  const isFiltered = asset?.pipeline_status === 'DERIVED_FILTERED' || asset?.pipeline_status === 'LORA_TRAINED'

  const filterCounts = useMemo(
    () => ({
      pass: images.filter((image) => image.filter_result === 'PASS').length,
      fail: images.filter((image) => image.filter_result === 'FAIL').length,
      skip: images.filter((image) => image.filter_result === 'SKIP').length,
    }),
    [images]
  )

  async function handlePrepareLora() {
    setIsPreparingLora(true)
    setLoraError(null)
    try {
      await prepareLoraTraining(assetId, asset?.display_name)
      navigate(`/project/${id}/visual/${assetId}/lora-guide`)
    } catch (err) {
      logError('DerivedFlow.prepareLora', err)
      setLoraError('데이터 전송 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setIsPreparingLora(false)
    }
  }

  if (!asset) {
    return <div className="flex h-64 items-center justify-center text-slate-500">에셋을 찾을 수 없습니다.</div>
  }

  return (
    <div className="max-w-5xl space-y-6 p-6">
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
          <h1 className="text-xl font-semibold text-slate-100">{asset.display_name} 파생 이미지</h1>
          <p className="mt-1 text-sm text-slate-400">변형 이미지를 생성하고 필터링을 통해 시각적 일관성을 확인합니다.</p>
        </div>
      </div>

      {asset.anchor_image && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
          <img src={asset.anchor_image.image_url} alt="Anchor" className="h-14 w-14 rounded-lg object-cover" />
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">기준 앵커 이미지</div>
            <div className="mt-1 text-sm text-slate-200">이 이미지를 기준으로 모든 파생 이미지가 생성되고 필터링됩니다.</div>
          </div>
        </div>
      )}

      {images.length === 0 && !isGenerating && (
        <button
          onClick={() => generate()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500"
        >
          파생 이미지 전체 생성 시작
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
            생성 중단
          </button>
        </div>
      )}

      {(error || loraError) && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error || loraError}
        </div>
      )}

      <div className="space-y-6">
        {useMemo(() => {
          const groups = new Map()
          for (const image of images) {
            const key = image.category || 'Other'
            const existing = groups.get(key) ?? []
            existing.push(image)
            groups.set(key, existing)
          }
          return Array.from(groups.entries())
        }, [images]).map(([category, groupImages]) => (
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

      {isFiltered && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm">
          <span className="text-slate-400">필터링 결과 요약</span>
          <span className="text-green-300">통과(PASS) {filterCounts.pass}</span>
          <span className="text-red-300">탈락(FAIL) {filterCounts.fail}</span>
          <span className="text-yellow-300">제외(SKIP) {filterCounts.skip}</span>
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
              전체 재생성
            </button>
            <button
              onClick={() => {
                generate(selectedPresets)
                setSelectedPresets([])
              }}
              disabled={selectedPresets.length === 0}
              className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              선택항목 재생성 {selectedPresets.length > 0 ? `(${selectedPresets.length})` : ''}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {!isFiltered ? (
              <button
                onClick={filter}
                disabled={isFiltering}
                className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isFiltering ? '필터링 중...' : '유사도 필터링 실행'}
              </button>
            ) : (
              <button
                onClick={() => navigate(`/project/${id}/visual/${assetId}/gallery`)}
                className="rounded-xl bg-slate-700 py-3 font-medium text-slate-100 transition-colors hover:bg-slate-600"
              >
                최종 갤러리 확인
              </button>
            )}

            <button
              onClick={handlePrepareLora}
              disabled={isPreparingLora || filterCounts.pass + filterCounts.skip === 0}
              className="rounded-xl bg-teal-600 py-3 font-medium text-white transition-colors hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500"
            >
              {isPreparingLora ? '데이터 전송 중...' : 'LoRA 학습 데이터 준비 →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
