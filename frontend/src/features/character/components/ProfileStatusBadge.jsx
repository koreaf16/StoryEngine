/**
 * @file ProfileStatusBadge.jsx
 * @description 캐릭터 프로필 상태(미설정/임시/확정)를 색상 뱃지로 표시.
 * @usage CharacterCard.jsx, CharacterConfirmPage.jsx에서 사용.
 * @connects shared/components/ui/Badge.jsx, shared/constants/colors.js, shared/constants/badgeConfig.js
 * @doc docs/03-character-setup.md (profile_status)
 */
import Badge from '../../../shared/components/ui/Badge.jsx'
import { PROFILE_STATUS_COLORS } from '../../../shared/constants/colors.js'
import { PROFILE_STATUS_LABELS } from '../../../shared/constants/badgeConfig.js'

export default function ProfileStatusBadge({ status = 'NONE' }) {
  const color = PROFILE_STATUS_COLORS[status] ?? PROFILE_STATUS_COLORS.NONE
  const label = PROFILE_STATUS_LABELS[status] ?? '미설정'
  return (
    <Badge bg={color.bg} text={color.text}>
      {label}
    </Badge>
  )
}
