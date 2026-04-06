/**
 * @file FilterSummary.jsx
 * @description 얼굴 유사도 필터링 결과 요약 (통과/탈락/스킵 수치).
 * @usage DerivedImagesPage에서 필터링 완료 후 결과 표시 시 사용.
 * @connects DerivedImagesPage
 * @doc docs/04-visual-factory.md (파생 이미지 필터링)
 */

export default function FilterSummary({ passCount, failCount, skipCount }) {
  const total = passCount + failCount + skipCount

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700">
      <span className="text-xs text-slate-500 mr-1">필터 결과</span>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        <span className="text-sm text-green-400 font-medium tabular-nums">{passCount}</span>
        <span className="text-xs text-slate-500 ml-0.5">통과</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
        <span className="text-sm text-red-400 font-medium tabular-nums">{failCount}</span>
        <span className="text-xs text-slate-500 ml-0.5">탈락</span>
      </div>
      {skipCount > 0 && (
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          <span className="text-sm text-yellow-400 font-medium tabular-nums">{skipCount}</span>
          <span className="text-xs text-slate-500 ml-0.5">스킵</span>
        </div>
      )}
      <span className="ml-auto text-xs text-slate-600">전체 {total}장</span>
    </div>
  )
}
