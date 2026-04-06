/**
 * @file parseScriptJson.js
 * @description LLM 대본 응답(프롬프트 D2) JSON 파서. 씬별 대사 배열 추출 + 필드 검증.
 * @usage SkeletonPromptPage에서 D2 LLM 응답 붙여넣기 후 호출.
 * @connects features/episode/pages/SkeletonPromptPage.jsx
 * @doc docs/05-episode.md (대본 생성 — 프롬프트 D2)
 */

import { logError } from '../../../shared/utils/logger.js'

const REQUIRED_SCENE_FIELDS = ['scene_number', 'dialogues']
const REQUIRED_DIALOGUE_FIELDS = ['speaker_asset', 'text', 'emotion']

export default function parseScriptJson(raw) {
  const trimmed = raw.trim()

  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, trimmed]
  const jsonStr = jsonMatch[1].trim()

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch (error) {
    logError('parseScriptJson', error, { preview: jsonStr.slice(0, 200) })
    return { ok: false, error: 'JSON 파싱 실패. 올바른 JSON 형식인지 확인하세요.' }
  }

  const scenes = Array.isArray(parsed) ? parsed : parsed.scenes
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return { ok: false, error: '씬 배열이 비어있습니다.' }
  }

  for (const scene of scenes) {
    const missing = REQUIRED_SCENE_FIELDS.filter((f) => scene[f] === undefined)
    if (missing.length > 0) {
      return { ok: false, error: `씬 ${scene.scene_number ?? '?'} 필드 누락: ${missing.join(', ')}` }
    }
    if (!Array.isArray(scene.dialogues)) {
      return { ok: false, error: `씬 ${scene.scene_number}의 dialogues가 배열이 아닙니다.` }
    }
    for (const d of scene.dialogues) {
      const missingD = REQUIRED_DIALOGUE_FIELDS.filter((f) => d[f] === undefined)
      if (missingD.length > 0) {
        return { ok: false, error: `씬 ${scene.scene_number} 대사 필드 누락: ${missingD.join(', ')}` }
      }
    }
  }

  const normalized = scenes.map((s) => ({
    scene_number: s.scene_number,
    emotion_arc: s.emotion_arc || '',
    dialogues: s.dialogues.map((d, i) => ({
      order_index: d.order_index ?? i,
      speaker_asset: d.speaker_asset,
      text: d.text,
      emotion: d.emotion,
      intensity: Number(d.intensity) || 3,
      timing_hint: d.timing_hint || 'beat',
      dialogue_visual_rel: d.dialogue_visual_rel || 'complement',
      acting_direction: d.acting_direction || '',
    })),
  }))

  return { ok: true, scriptScenes: normalized }
}
