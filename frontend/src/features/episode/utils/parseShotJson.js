/**
 * @file parseShotJson.js
 * @description LLM ???�답(?�롬?�트 E) JSON ?�서. ??배열 추출 + ?�드 검�?
 * @usage SkeletonPromptPage?�서 ?�별 LLM ?�답 붙여?�기 ???�출.
 * @connects features/episode/pages/SkeletonPromptPage.jsx
 * @doc docs/05-episode.md (??JSON 구조)
 */

import { logError } from '../../../shared/utils/logger.js'

const REQUIRED_FIELDS = ['shot_number', 'render_prompt', 'camera_motion', 'duration_sec']

export default function parseShotJson(raw) {
  const trimmed = raw.trim()

  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, trimmed]
  const jsonStr = jsonMatch[1].trim()

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch (error) {
    logError('parseShotJson', error, { preview: jsonStr.slice(0, 200) })
    return { ok: false, error: 'JSON ?�싱 ?�패. ?�바�?JSON ?�식?��? ?�인?�세??' }
  }

  const shots = Array.isArray(parsed) ? parsed : parsed.shots
  if (!Array.isArray(shots) || shots.length === 0) {
    return { ok: false, error: '??배열??비어?�습?�다.' }
  }

  for (const shot of shots) {
    const missing = REQUIRED_FIELDS.filter((f) => shot[f] === undefined)
    if (missing.length > 0) {
      return { ok: false, error: `??${shot.shot_number ?? '?'}???�드 ?�락: ${missing.join(', ')}` }
    }
  }

  const normalized = shots.map((s, i) => ({
    shot_number: s.shot_number ?? i + 1,
    render_prompt: s.render_prompt,
    camera_motion: s.camera_motion || 'Static',
    duration_sec: Number(s.duration_sec) || 5,
    transition: s.transition || 'cut',
    dialogues: Array.isArray(s.dialogues) ? s.dialogues : [],
    bgm_mood: s.bgm_mood || '',
    sfx: Array.isArray(s.sfx) ? s.sfx : [],
    narrative_note: s.narrative_note || '',
    // 시네마틱 메타데이터 (Prompt E 강화)
    framing_rationale: s.framing_rationale || '',
    rhythm_note: s.rhythm_note || '',
    connection_to_next: s.connection_to_next || '',
    assigned_dialogue_indices: Array.isArray(s.assigned_dialogue_indices) ? s.assigned_dialogue_indices : [],
    snap_image: null,
  }))

  return { ok: true, shots: normalized }
}



