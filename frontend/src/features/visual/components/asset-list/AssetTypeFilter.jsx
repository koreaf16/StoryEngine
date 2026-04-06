/**
 * @file AssetTypeFilter.jsx
 * @description 에셋 타입 필터 필 바 (ALL / 캐릭터 / NPC / 장소 / 아이템 / 몬스터).
 * @usage AssetSelectPage에서 에셋 목록 필터링에 사용.
 * @connects shared/constants/badgeConfig.js, shared/constants/colors.js
 * @doc docs/04-visual-factory.md (에셋 선택 화면)
 */
import { ASSET_TYPE_LABELS } from '../../../../shared/constants/badgeConfig.js'
import { ASSET_TYPE_COLORS } from '../../../../shared/constants/colors.js'

const FILTERS = [
  { key: 'ALL', label: '전체' },
  ...Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => ({ key, label })),
]

export default function AssetTypeFilter({ activeFilter, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {FILTERS.map(({ key, label }) => {
        const isActive = activeFilter === key
        const typeColor = ASSET_TYPE_COLORS[key]
        const activeStyle = typeColor
          ? `${typeColor.bg} ${typeColor.text} border ${typeColor.border}/50`
          : 'bg-teal-500/10 text-teal-400 border border-teal-500/50'

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer
              ${isActive
                ? activeStyle
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200 hover:border-slate-600'
              }
            `}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
