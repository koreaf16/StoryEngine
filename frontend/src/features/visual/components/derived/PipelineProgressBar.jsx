/**
 * @file PipelineProgressBar.jsx
 * @description 파생 이미지 생성 진행률 바. 완료 수 / 전체 수 표시.
 * @usage DerivedImagesPage에서 생성 진행 중 표시 시 사용.
 * @connects DerivedImagesPage
 * @doc docs/04-visual-factory.md (파생 이미지 생성)
 */

export default function PipelineProgressBar({ completed, total, label }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{label ?? '이미지 생성 중...'}</span>
        <span className="text-slate-400 tabular-nums">{completed} / {total}</span>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-slate-500 text-right tabular-nums">{pct}%</div>
    </div>
  )
}
