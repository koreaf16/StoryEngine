/**
 * @file features/episode/components/storyboard/SnapGenerateBar.jsx
 * @description 스냅 이미지 배치 생성 진행 UI. 미생성 샷이 있을 때 표시되며, 생성 중 프로그레스를 보여준다.
 * @usage features/episode/pages/StoryboardPage.jsx에서 렌더링.
 * @connects features/episode/hooks/useSnapGeneration.js
 * @doc docs/05-episode.md (5. 스냅 이미지 생성)
 */

export default function SnapGenerateBar({ missingCount, isGenerating, completedCount, totalCount, currentTask, latestSnap, error, onGenerate, onStop }) {
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-3">
      {isGenerating ? (
        <>
          {/* 최근 생성된 스냅 썸네일 */}
          <div className="shrink-0 w-14 h-9 rounded border border-slate-600 overflow-hidden bg-slate-700 flex items-center justify-center">
            {latestSnap ? (
              <img src={latestSnap} alt="latest snap" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-4 h-4 text-slate-500 animate-pulse" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M3.75 7.5h16.5" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300 font-medium">스냅 생성 중</span>
              <span className="text-xs text-slate-400 font-mono">{completedCount} / {totalCount}</span>
            </div>
            {currentTask && (
              <p className="text-xs text-teal-400 mb-1.5 truncate">{currentTask}</p>
            )}
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <button
            onClick={onStop}
            className="shrink-0 px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500 rounded transition-colors"
          >
            중지
          </button>
        </>
      ) : (
        <>
          <div className="flex-1">
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : missingCount > 0 ? (
              <p className="text-xs text-slate-400">
                스냅 이미지가 없는 샷 <span className="text-slate-200 font-medium">{missingCount}개</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                모든 스냅 이미지가 생성되었습니다.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {missingCount > 0 && (
              <button
                onClick={() => onGenerate(false)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 border border-teal-500/40 hover:border-teal-400 rounded transition-colors"
              >
                미생성분 생성
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('모든 스냅샷을 처음부터 다시 생성하시겠습니까? (기존 이미지는 유지되나 DB 연결이 교체됩니다)')) {
                  onGenerate(true)
                }
              }}
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-500 rounded transition-colors"
            >
              전체 새로 생성
            </button>
          </div>
        </>
      )}
    </div>
  )
}
