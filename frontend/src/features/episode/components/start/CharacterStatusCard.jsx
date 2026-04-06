/**
 * @file CharacterStatusCard.jsx
 * @description 에피소드 시작 화면의 캐릭터/NPC 상태 카드. 프로필 뱃지 + 현재 상태 표시.
 * @usage EpisodeStartPage.jsx 내부에서 캐릭터/NPC 에셋별로 렌더링.
 * @connects shared/constants/colors.js (에셋 타입 색상)
 * @doc docs/05-episode.md (컨텍스트 조립 — 캐릭터 현재 상태)
 */
import Badge from '../../../../shared/components/ui/Badge.jsx'
import { ASSET_TYPE_COLORS } from '../../../../shared/constants/colors.js'

export default function CharacterStatusCard({ asset }) {
  const typeColor = ASSET_TYPE_COLORS[asset.asset_type] || ASSET_TYPE_COLORS.CHARACTER

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
      {/* 아바타 */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${typeColor.bg} ${typeColor.text} shrink-0`}>
        {asset.display_name.charAt(0)}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{asset.display_name}</span>
          <Badge bg={typeColor.bg} text={typeColor.text}>{asset.asset_type}</Badge>
        </div>
        {asset.personality && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{asset.personality}</p>
        )}
      </div>

      {/* 시각 전략 뱃지 */}
      <Badge
        bg={asset.visual_strategy === 'LORA' ? 'bg-teal-500/20' : 'bg-slate-600/30'}
        text={asset.visual_strategy === 'LORA' ? 'text-teal-400' : 'text-slate-400'}
      >
        {asset.visual_strategy}
      </Badge>
    </div>
  )
}
