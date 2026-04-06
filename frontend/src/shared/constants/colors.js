/**
 * @file colors.js
 * @description 에셋 타입별, 전략별 색상 매핑 상수.
 * @usage Badge, AssetRow 등 에셋 관련 UI에서 색상 결정 시 사용.
 * @connects shared/components/ui/Badge.jsx, shared/constants/badgeConfig.js
 * @doc docs/10-ui-spec.md (에셋 상태 뱃지 색상)
 */

export const ASSET_TYPE_COLORS = {
  CHARACTER: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500' },
  NPC: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500' },
  LOCATION: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
  ITEM: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' },
  MONSTER: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500' },
}

export const VISUAL_STRATEGY_COLORS = {
  PROMPT: { bg: 'bg-slate-600/30', text: 'text-slate-400' },
  LORA: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
}

export const AVATAR_COLORS = {
  CHARACTER: 'bg-teal-600',
  NPC: 'bg-purple-600',
  LOCATION: 'bg-blue-600',
  ITEM: 'bg-orange-600',
  MONSTER: 'bg-slate-600',
}

export const GRADE_COLORS = {
  S: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' },
  A: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500' },
  B: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
  C: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500' },
}

export const FILTER_RESULT_COLORS = {
  PASS: { bg: 'bg-green-500/20', text: 'text-green-400' },
  FAIL: { bg: 'bg-red-500/20', text: 'text-red-400' },
  SKIP: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
}

export const PROFILE_STATUS_COLORS = {
  NONE: { bg: 'bg-slate-600/30', text: 'text-slate-400' },
  AUTO: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  CONFIRMED: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
}
