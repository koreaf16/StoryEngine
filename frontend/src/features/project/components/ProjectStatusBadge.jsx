/**
 * @file ProjectStatusBadge.jsx
 * @description 프로젝트 상태 뱃지. 현재 진행 단계를 색상+라벨로 표시.
 * @usage ProjectCard에서 프로젝트 상태 표시.
 * @connects shared/components/ui/Badge.jsx, shared/constants/badgeConfig.js
 * @doc docs/01-project.md (프로젝트 상태)
 */
import Badge from '../../../shared/components/ui/Badge.jsx'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '../../../shared/constants/badgeConfig.js'

export default function ProjectStatusBadge({ status }) {
  const label = PROJECT_STATUS_LABELS[status] || status
  const colors = PROJECT_STATUS_COLORS[status] || { bg: 'bg-slate-600/30', text: 'text-slate-400' }

  return (
    <Badge bg={colors.bg} text={colors.text}>
      {label}
    </Badge>
  )
}
