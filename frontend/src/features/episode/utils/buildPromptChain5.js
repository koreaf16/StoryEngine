/**
 * @file buildPromptChain5.js
 * @description Chain 5 영상 프롬프트 조립. Wan2.2 I2V용 씬·샷 정보 주입.
 * @usage useChainDesign.js에서 호출.
 * @connects features/episode/constants/promptTemplateChain5.js
 * @doc docs/05-episode.md (Chain 5: 영상 프롬프트)
 */
import { PROMPT_CHAIN5_TEMPLATE } from '../constants/promptTemplateChain5.js'

export default function buildPromptChain5({ episodeNumber, scenes, demoMode = true }) {
  const targetScenes = demoMode ? scenes.slice(0, 1) : scenes

  const scenesJson = JSON.stringify(
    targetScenes.map((sc) => ({
      scene_number: sc.scene_number,
      title: sc.title,
      mood: sc.mood,
      shots: (sc.shots || []).map((sh) => ({
        shot_number: sh.shot_number,
        render_prompt: sh.render_prompt,
        camera_motion: sh.camera_motion,
        duration_sec: sh.duration_sec,
        narrative_note: sh.narrative_note,
        rhythm_note: sh.rhythm_note,
      })),
    })),
    null, 2
  )

  const demoInstruction = demoMode
    ? '[데모 모드] 씬 1개만 처리하라.'
    : ''

  return PROMPT_CHAIN5_TEMPLATE
    .replace(/{episodeNumber}/g, episodeNumber)
    .replace('{demoInstruction}', demoInstruction)
    .replace('{scenesJson}', scenesJson)
}
