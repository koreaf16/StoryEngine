/**
 * @file AnchorSelectPage.jsx
 * @description 3-b: 앵커 이미지 선택 페이지. 프롬프트 편집 → 후보 생성 → 앵커 확정.
 * @usage /project/:id/visual/:assetId/anchor 라우트에서 렌더링.
 * @connects useAnchorGeneration, MethodSelector, AppearancePromptEditor, CandidateGrid
 * @doc docs/04-visual-factory.md (앵커 선택)
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import useAnchorGeneration from '../hooks/useAnchorGeneration.js'
import useComfyUIQueue from '../hooks/useComfyUIQueue.js'
import MethodSelector from '../components/anchor/MethodSelector.jsx'
import AppearancePromptEditor from '../components/anchor/AppearancePromptEditor.jsx'
import PhotoUpload from '../components/anchor/PhotoUpload.jsx'
import CandidateGrid from '../components/anchor/CandidateGrid.jsx'
import ComfyUIQueueStatus from '../components/anchor/ComfyUIQueueStatus.jsx'
import DerivedImagesPreview from '../components/anchor/DerivedImagesPreview.jsx'

export default function AnchorSelectPage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const asset = project?.assets?.find((a) => a.asset_id === assetId)

  const [method, setMethod] = useState('TEXT')
  const [count, setCount] = useState(5)
  const [weight, setWeight] = useState(0.8)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const { isGenerating, isConfirming, error, candidates, generate, confirm, savePrompt, stop } =
    useAnchorGeneration(id, assetId)
  const { queue, progress, progressPct, wsConnected } = useComfyUIQueue(isGenerating)

  useEffect(() => {
    if (asset?.appearance_prompt) {
      setPrompt(asset.appearance_prompt)
    }
  }, [asset?.appearance_prompt])

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        에셋을 찾을 수 없습니다.
      </div>
    )
  }

  async function handleGenerate() {
    setSelectedCandidate(null)
    savePrompt(prompt)
    await generate(prompt, count, method === 'PHOTO' ? selectedFile : null, weight)
  }

  async function handleConfirm() {
    if (!selectedCandidate) return
    const result = await confirm(selectedCandidate.image_id)
    if (result) {
      navigate(`/project/${id}/visual/${assetId}/derived`)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/project/${id}/visual`)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{asset.display_name} — 앵커 선택</h1>
          <p className="text-sm text-slate-400 mt-0.5">기준 이미지를 선택합니다. 이 이미지가 향후 이미지 생성의 기준이 됩니다.</p>
        </div>
      </div>

      {/* 확정된 앵커 미리보기 */}
      {asset.anchor_image && (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
          <div className="flex items-center gap-4">
            <img
              src={asset.anchor_image.image_url}
              alt="Confirmed anchor"
              className="h-20 w-20 rounded-lg object-cover border border-slate-600"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wider text-teal-500">확정된 앵커</div>
              <p className="mt-1 text-sm text-slate-300">
                이미 선택된 앵커가 있습니다. 아래에서 새로 생성하면 교체됩니다.
              </p>
              <button
                onClick={() => navigate(`/project/${id}/visual/${assetId}/derived`)}
                className="mt-2 text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                파생 이미지 보기 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 파생 이미지 미리보기 */}
      <DerivedImagesPreview images={asset.derived_images} />

      {/* 생성 방법 선택 */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">생성 방법</h2>
        <MethodSelector value={method} onChange={setMethod} />
      </div>

      {/* 외모 프롬프트 편집 */}
      <AppearancePromptEditor
        value={prompt}
        onChange={setPrompt}
        onSave={savePrompt}
      />

      {/* 사진 업로드 모드 */}
      {method === 'PHOTO' && (
        <div className="space-y-6">
          <PhotoUpload
            file={selectedFile}
            onFileChange={setSelectedFile}
            isGenerating={isGenerating}
          />
          {selectedFile && (
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-slate-300">참조 사진 반영 정도 (유사도)</h2>
                <span className="text-sm text-teal-400 font-medium bg-teal-500/10 px-2 py-0.5 rounded">{weight.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                disabled={isGenerating}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500 disabled:opacity-50"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>낮음 (자연스러움 우선)</span>
                <span>높음 (매우 닮게)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 생성 매수 선택 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">생성 매수</h2>
          <span className="text-sm text-teal-400 font-medium bg-teal-500/10 px-2 py-0.5 rounded">{count}장</span>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          step="1"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value, 10))}
          disabled={isGenerating}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500 disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>1장</span>
          <span>30장</span>
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || (method === 'PHOTO' && !selectedFile)}
        className="w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            ComfyUI에서 이미지 생성 중...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {method === 'PHOTO' ? '사진 기반 후보 생성' : `후보 ${count}장 생성`}
          </>
        )}
      </button>

      {/* 생성 중단 버튼 */}
      {isGenerating && (
        <button
          onClick={stop}
          className="w-full py-2.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1.5" />
          </svg>
          생성 중단
        </button>
      )}

      {/* ComfyUI 큐 상태 */}
      {isGenerating && (
        <ComfyUIQueueStatus queue={queue} progress={progress} progressPct={progressPct} wsConnected={wsConnected} hideStepProgress />
      )}

      {/* 오류 */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* 후보 그리드 */}
      {(candidates.length > 0 || isGenerating) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              후보 이미지 선택
            </h2>
            {isGenerating && (
              <span className="text-xs text-slate-500 tabular-nums">
                {candidates.length} / {count}
              </span>
            )}
          </div>
          <CandidateGrid
            candidates={candidates}
            selectedIndex={selectedCandidate?.index ?? null}
            onSelect={(c) => setSelectedCandidate(c)}
            totalCount={count}
            isGenerating={isGenerating}
            progressPct={progressPct}
          />
        </div>
      )}

      {/* 확정 버튼 */}
      {candidates.length > 0 && (
        <button
          onClick={handleConfirm}
          disabled={!selectedCandidate || isConfirming}
          className="w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isConfirming ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              앵커 확정 중...
            </>
          ) : (
            selectedCandidate ? `#${selectedCandidate.index + 1} 이미지로 앵커 확정 →` : '이미지를 선택하세요'
          )}
        </button>
      )}
    </div>
  )
}
