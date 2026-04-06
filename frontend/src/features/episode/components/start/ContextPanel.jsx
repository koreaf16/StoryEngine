/**
 * @file ContextPanel.jsx
 * @description 에피소드 시작 화면의 스토리 컨텍스트 패널. 방향타 요약 + 장르/분위기 표시.
 * @usage EpisodeStartPage.jsx 내부.
 * @connects store/useProjectStore.js (storyCompass)
 * @doc docs/05-episode.md (1. 컨텍스트 조립)
 */
import Card from '../../../../shared/components/ui/Card.jsx'
import Badge from '../../../../shared/components/ui/Badge.jsx'

export default function ContextPanel({ project }) {
  const compass = project.storyCompass
  const hasCompass = compass && typeof compass === 'object'

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Context Engine Summary</h3>
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {/* 장르 / 분위기 */}
      <div className="flex items-center gap-2">
        <Badge bg="bg-teal-500/20" text="text-teal-400">{project.genre || '장르 미설정'}</Badge>
        <span className="text-slate-600">|</span>
        <span className="text-sm text-slate-400">{project.mood || '분위기 미설정'}</span>
      </div>

      {/* 방향타 요약 */}
      {hasCompass ? (
        <div className="space-y-3">
          {compass.protagonist_motivation && (
            <div>
              <p className="text-xs text-slate-500 mb-1">주인공 동기</p>
              <p className="text-sm text-slate-300">{compass.protagonist_motivation}</p>
            </div>
          )}
          {compass.possible_directions && (
            <div>
              <p className="text-xs text-slate-500 mb-1">가능한 방향</p>
              <ul className="space-y-1">
                {(Array.isArray(compass.possible_directions) ? compass.possible_directions : [compass.possible_directions]).map((d, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">-</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-500 py-2">
          {project.storyCompass
            ? <pre className="whitespace-pre-wrap text-slate-400 text-xs leading-relaxed max-h-40 overflow-y-auto">{typeof project.storyCompass === 'string' ? project.storyCompass : JSON.stringify(project.storyCompass, null, 2)}</pre>
            : '방향타가 아직 설정되지 않았습니다. 1단계(Script)를 완료하세요.'}
        </div>
      )}
    </Card>
  )
}
