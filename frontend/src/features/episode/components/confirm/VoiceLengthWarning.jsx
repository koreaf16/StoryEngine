/**
 * @file VoiceLengthWarning.jsx
 * @description 음성 길이 검증 경고 목록. 대사 길이 > 샷 duration 경우 표시.
 * @usage EpisodeConfirmPage.jsx 내 ProcessingCard 안에 렌더링.
 * @connects features/episode/pages/EpisodeConfirmPage.jsx
 * @doc docs/05-episode.md (음성 길이 검증)
 */
import Button from '../../../../shared/components/ui/Button.jsx'

export default function VoiceLengthWarning({ warnings }) {
  if (!warnings || warnings.length === 0) return null

  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="text-xs">
            <span className="text-amber-400 font-medium">샷 {w.shotNumber}</span>
            <span className="text-slate-500 ml-2">
              대사 {w.voiceDuration}s &gt; 장면 {w.sceneDuration}s
            </span>
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" className="text-[10px] px-2 py-1">대사 줄이기</Button>
            <Button variant="ghost" className="text-[10px] px-2 py-1">장면 연장</Button>
          </div>
        </div>
      ))}
    </div>
  )
}
