/**
 * @file buildPromptF.js
 * @description 프롬프트 F(씬별 사운드 설계) 조립 유틸. 씬 데이터 + 샷 + 대사로 사운드 프롬프트 생성.
 * @usage SkeletonPromptPage에서 씬별 샷 완료 후 호출.
 * @connects features/episode/constants/promptTemplateF.js
 * @doc docs/05-episode.md (사운드 설계 — 프롬프트 F)
 */
import { PROMPT_F_TEMPLATE } from '../constants/promptTemplateF.js'

export default function buildPromptF({ episodeNumber, scene, shots, sceneDialogues = [], allScenes = [] }) {
  const sceneData = JSON.stringify({
    scene_number: scene.scene_number,
    title: scene.title,
    core_event: scene.core_event,
    mood: scene.mood,
    tension_level: scene.tension_level,
    color_palette: scene.color_palette || '',
    emotional_bridge: scene.emotional_bridge || '',
    connection_device: scene.connection_device || '',
  }, null, 2)

  const shotsJson = JSON.stringify(
    shots.map((s) => ({
      shot_number: s.shot_number,
      camera_motion: s.camera_motion,
      duration_sec: s.duration_sec,
      transition: s.transition,
      narrative_note: s.narrative_note || '',
      framing_rationale: s.framing_rationale || '',
      rhythm_note: s.rhythm_note || '',
    })),
    null,
    2
  )

  const dialoguesJson = sceneDialogues.length > 0
    ? JSON.stringify(
        sceneDialogues.map((d) => ({
          order_index: d.order_index,
          speaker_asset: d.speaker_asset,
          text: d.text,
          emotion: d.emotion,
          intensity: d.intensity,
          timing_hint: d.timing_hint,
          acting_direction: d.acting_direction || '',
        })),
        null,
        2
      )
    : '(대사 없는 씬)'

  // 에피소드 컬러 흐름
  const colorScript = allScenes.length > 0
    ? allScenes.map((s) => `씬 ${s.scene_number} "${s.title}": ${s.color_palette || '(미설정)'}`).join('\n')
    : '(컬러 스크립트 없음)'

  return PROMPT_F_TEMPLATE
    .replace('{episodeNumber}', episodeNumber)
    .replace('{sceneNumber}', scene.scene_number)
    .replace('{sceneTitle}', scene.title)
    .replace('{sceneData}', sceneData)
    .replace('{shotsJson}', shotsJson)
    .replace('{dialoguesJson}', dialoguesJson)
    .replace('{colorScript}', colorScript)
}
