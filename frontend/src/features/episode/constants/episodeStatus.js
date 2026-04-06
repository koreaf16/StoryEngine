/**
 * @file episodeStatus.js
 * @description 에피소드 상태, 카메라 모션, 전환 효과 등 에피소드 관련 상수.
 * @usage 에피소드 페이지, ShotCard, 스토리보드 등에서 사용.
 * @connects features/episode/pages/*, features/episode/components/*
 * @doc docs/05-episode.md (에피소드 흐름)
 */

export const EPISODE_STATUS = {
  DRAFT: 'DRAFT',
  NOVEL: 'NOVEL',
  CHAIN_DESIGN: 'CHAIN_DESIGN',
  SKELETON: 'SKELETON',
  SHOTS_GENERATING: 'SHOTS_GENERATING',
  STORYBOARD: 'STORYBOARD',
  CONFIRMED: 'CONFIRMED',
}

export const EPISODE_STATUS_LABELS = {
  DRAFT: '초안',
  NOVEL: '소설 완료',
  CHAIN_DESIGN: '씬 설계 중',
  SKELETON: '골격 생성됨',
  SHOTS_GENERATING: '샷 생성 중',
  STORYBOARD: '스토리보드',
  CONFIRMED: '확정',
}

export const EPISODE_STATUS_COLORS = {
  DRAFT: { bg: 'bg-slate-600/30', text: 'text-slate-400' },
  NOVEL: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  CHAIN_DESIGN: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  SKELETON: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  SHOTS_GENERATING: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  STORYBOARD: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  CONFIRMED: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
}

export const CAMERA_MOTIONS = ['Static', 'Dolly In', 'Dolly Out', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down']

export const TRANSITIONS = ['cut', 'dissolve', 'fade_to_black']

export const TRANSITION_LABELS = {
  cut: 'Cut',
  dissolve: 'Dissolve',
  fade_to_black: 'Fade to Black',
}

export const TTS_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETE: 'COMPLETE',
}

export const TTS_STATUS_LABELS = {
  PENDING: '대기 중',
  PROCESSING: '생성 중',
  COMPLETE: '완료',
}

// 대사-영상 관계 (Prompt D2)
export const DIALOGUE_VISUAL_REL = ['complement', 'contrast', 'extend']
export const DIALOGUE_VISUAL_REL_LABELS = {
  complement: '보완 — 대사가 화면을 보완',
  contrast: '대조 — 화면이 대사와 반대',
  extend: '확장 — 화면이 대사 너머를 보여줌',
}

// 대사 타이밍 힌트 (Prompt D2)
export const TIMING_HINTS = ['beat', 'pause', 'rapid']
export const TIMING_HINT_LABELS = {
  beat: '비트 (짧은 여백)',
  pause: '침묵 (긴 간격)',
  rapid: '빠른 응수',
}

// 씬 연결 장치 (Prompt D)
export const CONNECTION_DEVICES = ['match_cut', 'sound_bridge', 'motif_echo', 'hard_cut']
export const CONNECTION_DEVICE_LABELS = {
  match_cut: '매치컷',
  sound_bridge: '사운드 브릿지',
  motif_echo: '모티프 에코',
  hard_cut: '하드컷',
}
