/**
 * @file ProcessingCard.jsx
 * @description 에피소드 확정 후처리 단계 카드. 상태(대기/처리중/완료) + 상세 정보 표시.
 * @usage EpisodeConfirmPage.jsx에서 TTS, Export, World State 각 단계 표시.
 * @connects shared/components/ui/Card.jsx, shared/components/ui/Badge.jsx
 * @doc docs/05-episode.md (7. 에피소드 확정)
 */
import Card from '../../../../shared/components/ui/Card.jsx'
import Badge from '../../../../shared/components/ui/Badge.jsx'

const STATUS_CONFIG = {
  pending: { bg: 'bg-slate-600/30', text: 'text-slate-400', label: '대기 중' },
  processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '처리 중' },
  complete: { bg: 'bg-teal-500/20', text: 'text-teal-400', label: '완료' },
  warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '경고' },
}

export default function ProcessingCard({ title, status, subtitle, icon, children }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bg}`}>
            {icon}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">{title}</h4>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <Badge bg={config.bg} text={config.text}>{config.label}</Badge>
      </div>
      {children && <div className="mt-3 pl-11">{children}</div>}
    </Card>
  )
}
