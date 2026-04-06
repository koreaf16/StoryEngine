/**
 * @file ComfyUIQueueStatus.jsx
 * @description ComfyUI 큐 상태 + step 진행률 실시간 표시 컴포넌트.
 * @usage AnchorSelectPage, DerivedImagesPage에서 생성 중 표시.
 * @connects useComfyUIQueue.js
 * @doc docs/04-visual-factory.md (ComfyUI 큐 상태)
 */

export default function ComfyUIQueueStatus({ queue, progress, progressPct, wsConnected, hideStepProgress = false }) {
  return (
    <div className="rounded-lg bg-slate-800/80 border border-slate-700 px-4 py-3 space-y-3">
      {/* 큐 상태 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            ComfyUI 큐
          </span>
          {wsConnected !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${wsConnected ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
              WS {wsConnected ? 'ON' : 'OFF'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-300">
              실행 중 <span className="text-green-400 font-semibold">{queue.running}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-xs text-slate-300">
              대기 <span className="text-yellow-400 font-semibold">{queue.pending}</span>
            </span>
          </div>
        </div>
      </div>

      {/* step 진행률 (hideStepProgress=true면 숨김 — 그리드 슬롯에서 표시) */}
      {!hideStepProgress && progress.max > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>현재 이미지 step 진행률</span>
            <span className="tabular-nums">{progress.value} / {progress.max} steps</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
