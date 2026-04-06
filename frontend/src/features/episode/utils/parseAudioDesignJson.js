/**
 * @file parseAudioDesignJson.js
 * @description LLM 사운드 설계 응답(프롬프트 F) JSON 파서. 씬별 4레이어 오디오 구조 검증.
 * @usage SkeletonPromptPage에서 F LLM 응답 붙여넣기 후 호출.
 * @connects features/episode/pages/SkeletonPromptPage.jsx
 * @doc docs/05-episode.md (사운드 설계 — 프롬프트 F)
 */

import { logError } from '../../../shared/utils/logger.js'

export default function parseAudioDesignJson(raw) {
  const trimmed = raw.trim()

  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, trimmed]
  const jsonStr = jsonMatch[1].trim()

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch (error) {
    logError('parseAudioDesignJson', error, { preview: jsonStr.slice(0, 200) })
    return { ok: false, error: 'JSON 파싱 실패. 올바른 JSON 형식인지 확인하세요.' }
  }

  // 단일 씬 객체 또는 배열 모두 허용
  const raw_design = Array.isArray(parsed) ? parsed[0] : parsed

  if (!raw_design || typeof raw_design !== 'object') {
    return { ok: false, error: '사운드 설계 객체를 찾을 수 없습니다.' }
  }

  if (raw_design.scene_number === undefined) {
    return { ok: false, error: 'scene_number 필드가 없습니다.' }
  }

  const normalized = {
    scene_number: raw_design.scene_number,
    ambience: raw_design.ambience || '',
    music_segments: Array.isArray(raw_design.music_segments) ? raw_design.music_segments : [],
    foley_map: Array.isArray(raw_design.foley_map) ? raw_design.foley_map : [],
    design_sfx: Array.isArray(raw_design.design_sfx) ? raw_design.design_sfx : [],
    sound_bridges: raw_design.sound_bridges || '',
    tts_direction: Array.isArray(raw_design.tts_direction) ? raw_design.tts_direction : [],
    mix_balance: raw_design.mix_balance || {
      narration_db: -3,
      music_db: -12,
      sfx_db: -8,
      ambience_db: -18,
      exceptions: '',
    },
  }

  return { ok: true, audioDesign: normalized }
}
