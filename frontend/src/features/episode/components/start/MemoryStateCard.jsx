/**
 * @file MemoryStateCard.jsx
 * @description 에피소드 시작 화면의 기억 상태 카드. 벡터 DB, 그래프 DB 현황 표시.
 * @usage EpisodeStartPage.jsx 내부.
 * @connects store/useProjectStore.js
 * @doc docs/05-episode.md (컨텍스트 조립 — 3중 기억 소스)
 */
import Card from '../../../../shared/components/ui/Card.jsx'

export default function MemoryStateCard({ episodeNumber }) {
  const isFirstEpisode = episodeNumber <= 1

  return (
    <Card className="p-4 space-y-3">
      <h4 className="text-sm font-semibold text-white">기억 상태</h4>

      <div className="grid grid-cols-2 gap-3">
        {/* 벡터 DB */}
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
            </svg>
            <span className="text-xs text-slate-400">Vector DB</span>
          </div>
          <p className="text-sm text-slate-300">
            {isFirstEpisode ? '비어있음' : `${(episodeNumber - 1) * 8}개 장면 저장됨`}
          </p>
        </div>

        {/* 그래프 DB */}
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <span className="text-xs text-slate-400">Graph DB</span>
          </div>
          <p className="text-sm text-slate-300">
            {isFirstEpisode ? '초기 상태' : `미해결 복선 ${Math.max(1, episodeNumber - 1)}건`}
          </p>
        </div>
      </div>
    </Card>
  )
}
