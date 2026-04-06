/**
 * @file AssetRow.jsx
 * @description 에셋 행 컴포넌트. 아바타 + 이름 + 타입 뱃지 + 시각 전략 + 음성 정보 + 수정 버튼.
 * @usage AssetConfirmPage에서 각 에셋을 행으로 표시.
 * @connects Badge, colors.js, badgeConfig.js
 * @doc docs/02-script-input.md (에셋 확정 — 각 에셋마다 표시할 정보)
 */
import Badge from '../../../shared/components/ui/Badge.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { ASSET_TYPE_COLORS, VISUAL_STRATEGY_COLORS, AVATAR_COLORS } from '../../../shared/constants/colors.js'
import { ASSET_TYPE_LABELS } from '../../../shared/constants/badgeConfig.js'

export default function AssetRow({ asset, onEdit, onRemove }) {
  const typeColor = ASSET_TYPE_COLORS[asset.asset_type] || ASSET_TYPE_COLORS.MONSTER
  const stratColor = VISUAL_STRATEGY_COLORS[asset.visual_strategy] || VISUAL_STRATEGY_COLORS.PROMPT
  const avatarBg = AVATAR_COLORS[asset.asset_type] || 'bg-slate-600'
  const firstChar = asset.display_name?.charAt(0) || '?'
  const isProtagonist = asset.is_protagonist === true

  return (
    <div className={`flex items-center gap-4 px-4 py-3 bg-slate-800 rounded-lg ${isProtagonist ? 'border border-teal-500/40' : 'border border-slate-700'}`}>
      {/* 주인공 아이콘 */}
      {isProtagonist && (
        <span className="text-teal-400 shrink-0" title="주인공">★</span>
      )}

      {/* 아바타 */}
      <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
        {firstChar}
      </div>

      {/* 이름 */}
      <span className="text-sm text-white font-medium min-w-[80px]">
        {asset.display_name}
      </span>

      {/* 타입 뱃지 */}
      <Badge bg={typeColor.bg} text={typeColor.text}>
        {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
      </Badge>

      {/* 주인공 뱃지 */}
      {isProtagonist && (
        <Badge bg="bg-teal-500/20" text="text-teal-300">주인공</Badge>
      )}

      {/* 시각 전략 */}
      <Badge bg={stratColor.bg} text={stratColor.text}>
        {asset.visual_strategy}
      </Badge>

      {/* 음성 */}
      <span className="text-xs text-slate-500 ml-auto">
        {asset.audio_type === 'TTS' && (asset.voice_hint || 'TTS')}
        {asset.audio_type === 'SFX' && 'SFX'}
        {asset.audio_type === 'NONE' && 'NONE'}
      </span>

      {/* 액션 */}
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => onEdit(asset)}>
          수정
        </Button>
        <Button variant="ghost" className="text-xs px-2 py-1 text-red-400" onClick={() => onRemove(asset.asset_id)}>
          삭제
        </Button>
      </div>
    </div>
  )
}
