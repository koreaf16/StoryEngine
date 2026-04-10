/**
 * @file badgeConfig.js
 * @description 에셋 타입, 시각 전략, 프로젝트 상태의 한글 라벨 매핑.
 * @usage Badge 컴포넌트에서 타입별 라벨 표시 시 사용.
 * @connects shared/components/ui/Badge.jsx
 * @doc docs/10-ui-spec.md (에셋 상태 뱃지)
 */

export const ASSET_TYPE_LABELS = {
  CHARACTER: '캐릭터',
  NPC: 'NPC',
  LOCATION: '장소',
  ITEM: '아이템',
  MONSTER: '몬스터',
}

export const PROJECT_STATUS_LABELS = {
  SCRIPT_INPUT: '대본 입력',
  CHARACTER: '캐릭터 설정',
  VISUAL: '외형 작업',
  EPISODE: '에피소드 진행 중',
}

export const PROJECT_STATUS_COLORS = {
  SCRIPT_INPUT: { bg: 'bg-slate-600/30', text: 'text-slate-400' },
  CHARACTER: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  VISUAL: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  EPISODE: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
}

export const PIPELINE_STATUS_LABELS = {
  NONE: '미시작',
  ANCHOR_GENERATING: '앵커 생성 중',
  ANCHOR_SELECTED: '앵커 확정',
  DERIVED_GENERATING: '파생 생성 중',
  DERIVED_FILTERED: '필터 완료',
}

export const PROFILE_STATUS_LABELS = {
  NONE: '미설정',
  AUTO: '임시',
  CONFIRMED: '확정',
}

export const VISUAL_STYLE_LABELS = {
  PHOTOREALISTIC: '포토리얼',
  CARTOON: '카툰',
  ANIME: '애니메이션',
  '3D_RENDER': '3D 렌더',
}

export const VISUAL_STYLE_COLORS = {
  PHOTOREALISTIC: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  CARTOON: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  ANIME: { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  '3D_RENDER': { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
}

/** 썸네일 오버레이용 불투명 상태 뱃지 색상 */
export const PROJECT_STATUS_OVERLAY = {
  SCRIPT_INPUT: { bg: 'bg-teal-600', text: 'text-white' },
  CHARACTER: { bg: 'bg-purple-600', text: 'text-white' },
  VISUAL: { bg: 'bg-blue-600', text: 'text-white' },
  EPISODE: { bg: 'bg-teal-600', text: 'text-white' },
}
