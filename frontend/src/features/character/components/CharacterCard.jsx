/**
 * @file CharacterCard.jsx
 * @description 캐릭터 목록의 개별 카드. 아바타 + 이름 + 타입/상태 뱃지 + 프로필 설정 버튼.
 * @usage CharacterListPage.jsx에서 TTS 에셋 목록 렌더링.
 * @connects shared/components/ui/Badge.jsx, ProfileStatusBadge.jsx,
 *           shared/constants/colors.js, shared/constants/badgeConfig.js
 * @doc docs/03-character-setup.md (UI 흐름 — 캐릭터 목록 화면)
 */
import { useNavigate } from 'react-router-dom'
import Badge from '../../../shared/components/ui/Badge.jsx'
import ProfileStatusBadge from './ProfileStatusBadge.jsx'
import { ASSET_TYPE_COLORS, AVATAR_COLORS } from '../../../shared/constants/colors.js'
import { ASSET_TYPE_LABELS } from '../../../shared/constants/badgeConfig.js'

export default function CharacterCard({ asset, projectId }) {
  const navigate = useNavigate()
  const typeColor = ASSET_TYPE_COLORS[asset.asset_type] ?? ASSET_TYPE_COLORS.CHARACTER
  const avatarBg = AVATAR_COLORS[asset.asset_type] ?? 'bg-slate-600'
  const initial = asset.display_name.charAt(0)

  const handleClick = () => {
    const target =
      asset.profile_status === 'AUTO' || asset.profile_status === 'CONFIRMED'
        ? 'confirm'
        : 'prompt'
    navigate(`/project/${projectId}/characters/${asset.asset_id}/${target}`)
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-4 px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 hover:bg-slate-700/50 cursor-pointer transition-colors"
    >
      {/* 아바타 */}
      <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center shrink-0`}>
        <span className="text-sm font-bold text-white">{initial}</span>
      </div>

      {/* 이름 + 뱃지 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{asset.display_name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge bg={typeColor.bg} text={typeColor.text}>
            {ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}
          </Badge>
          {asset.voice_hint && (
            <span className="text-xs text-slate-500">{asset.voice_hint}</span>
          )}
        </div>
      </div>

      {/* 상태 뱃지 */}
      <ProfileStatusBadge status={asset.profile_status ?? 'NONE'} />

      {/* 프로필 설정 링크 */}
      <span className="text-xs text-teal-400 shrink-0">프로필 설정 →</span>
    </div>
  )
}
