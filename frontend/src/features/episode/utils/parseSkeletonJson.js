/**
 * @file parseSkeletonJson.js
 * @description LLM 골격 ?�답(?�롬?�트 D) JSON ?�서. ??배열 추출 + ?�드 검�?
 * @usage SkeletonPromptPage?�서 LLM ?�답 붙여?�기 ???�출.
 * @connects features/episode/pages/SkeletonPromptPage.jsx
 * @doc docs/05-episode.md (골격 JSON 구조)
 */

import { logError } from '../../../shared/utils/logger.js'

const REQUIRED_FIELDS = ['scene_number', 'title', 'location_asset', 'characters', 'core_event', 'mood']

export default function parseSkeletonJson(raw) {
  const trimmed = raw.trim()

  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, trimmed]
  const jsonStr = jsonMatch[1].trim()

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch (error) {
    logError('parseSkeletonJson', error, { preview: jsonStr.slice(0, 200) })
    return { ok: false, error: 'JSON ?�싱 ?�패. ?�바�?JSON ?�식?��? ?�인?�세??' }
  }

  const scenes = Array.isArray(parsed) ? parsed : parsed.scenes
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return { ok: false, error: '??배열??비어?�습?�다.' }
  }

  for (const scene of scenes) {
    const missing = REQUIRED_FIELDS.filter((f) => scene[f] === undefined)
    if (missing.length > 0) {
      return { ok: false, error: `??${scene.scene_number ?? '?'}???�드 ?�락: ${missing.join(', ')}` }
    }
  }

  const normalized = scenes.map((s, i) => ({
    scene_number: s.scene_number ?? i + 1,
    title: s.title,
    location_asset: s.location_asset,
    characters: Array.isArray(s.characters) ? s.characters : [],
    core_event: s.core_event,
    mood: s.mood,
    tension_level: s.tension_level ?? null,
    transition_from_prev: s.transition_from_prev ?? null,
    emotional_bridge: s.emotional_bridge ?? null,
    // 시네마틱 메타데이터 (Prompt D 강화)
    color_palette: s.color_palette ?? '',
    key_object: s.key_object ?? '',
    key_object_state: s.key_object_state ?? '',
    connection_device: s.connection_device ?? '',
    shots: [],
  }))

  return { ok: true, scenes: normalized }
}



