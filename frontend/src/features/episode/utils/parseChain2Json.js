/**
 * @file parseChain2Json.js
 * @description Chain 2 응답 파서. 씬+샷 통합 JSON 배열 추출 및 검증.
 * @usage useChainDesign.js에서 Chain 2 응답 파싱 시 사용.
 * @connects features/episode/pages/ChainDesignPage.jsx
 * @doc docs/05-episode.md (Chain 2: 씬·샷 설계)
 */
import { logError } from '../../../shared/utils/logger.js'

const REQUIRED_SCENE_FIELDS = ['scene_number', 'title', 'characters', 'core_event', 'mood', 'shots']

function normalizeShot(sh, idx) {
  return {
    shot_number: sh.shot_number ?? idx + 1,
    render_prompt: sh.render_prompt || '',
    camera_motion: sh.camera_motion || 'Static',
    duration_sec: sh.duration_sec ?? 4.0,
    transition: sh.transition || 'cut',
    dialogues: Array.isArray(sh.dialogues) ? sh.dialogues : [],
    bgm_mood: sh.bgm_mood || '',
    sfx: Array.isArray(sh.sfx) ? sh.sfx : [],
    narrative_note: sh.narrative_note || '',
    framing_rationale: sh.framing_rationale || '',
    rhythm_note: sh.rhythm_note || '',
  }
}

function normalizeScene(s, idx) {
  return {
    scene_number: s.scene_number ?? idx + 1,
    title: s.title || '',
    location_asset: s.location_asset || null,
    characters: Array.isArray(s.characters) ? s.characters : [],
    core_event: s.core_event || '',
    mood: s.mood || '',
    tension_level: s.tension_level ?? null,
    color_palette: s.color_palette || '',
    key_object: s.key_object || '',
    connection_device: s.connection_device || 'cut',
    shots: Array.isArray(s.shots) ? s.shots.map(normalizeShot) : [],
  }
}

export default function parseChain2Json(raw) {
  const trimmed = raw.trim()
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, trimmed]
  const jsonStr = jsonMatch[1].trim()

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch (error) {
    logError('parseChain2Json', error, { preview: jsonStr.slice(0, 200) })
    return { ok: false, error: 'JSON 파싱 실패. 올바른 JSON 형식인지 확인하세요.' }
  }

  const scenes = Array.isArray(parsed) ? parsed : parsed?.scenes
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return { ok: false, error: '씬 배열이 비어있습니다.' }
  }

  for (const scene of scenes) {
    const missing = REQUIRED_SCENE_FIELDS.filter((f) => scene[f] === undefined)
    if (missing.length > 0) {
      return { ok: false, error: `씬 ${scene.scene_number ?? '?'} 필드 누락: ${missing.join(', ')}` }
    }
    if (!Array.isArray(scene.shots) || scene.shots.length === 0) {
      return { ok: false, error: `씬 ${scene.scene_number}: 샷이 없습니다.` }
    }
  }

  return { ok: true, scenes: scenes.map(normalizeScene) }
}
