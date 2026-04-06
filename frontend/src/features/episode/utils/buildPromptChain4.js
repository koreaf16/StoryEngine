/**
 * @file buildPromptChain4.js
 * @description Chain 4 이미지 프롬프트 조립. 씬·샷 설계 + 에셋 정보 주입.
 * @usage useChainDesign.js에서 호출.
 * @connects features/episode/constants/promptTemplateChain4.js
 * @doc docs/05-episode.md (Chain 4: 이미지 프롬프트)
 */
import { PROMPT_CHAIN4_TEMPLATE } from '../constants/promptTemplateChain4.js'

export default function buildPromptChain4({ episodeNumber, scenes, assets, demoMode = true }) {
  const targetScenes = demoMode ? scenes.slice(0, 1) : scenes

  const assetList = (assets || [])
    .map((a) => {
      const loraTag = a.trigger_word ? ` trigger_word="${a.trigger_word}"` : ''
      const stratTag = a.visual_strategy === 'LORA' ? ' [LoRA]' : ' [PROMPT]'
      return `- ${a.asset_id} (${a.display_name}, ${a.asset_type}${stratTag}${loraTag})`
    })
    .join('\n')

  const scenesJson = JSON.stringify(
    targetScenes.map((sc) => ({
      scene_number: sc.scene_number,
      title: sc.title,
      mood: sc.mood,
      color_palette: sc.color_palette,
      shots: (sc.shots || []).map((sh) => ({
        shot_number: sh.shot_number,
        render_prompt: sh.render_prompt,
        camera_motion: sh.camera_motion,
        duration_sec: sh.duration_sec,
        dialogues: sh.dialogues,
      })),
    })),
    null, 2
  )

  const demoInstruction = demoMode
    ? '[데모 모드] 씬 1개만 처리하라.'
    : ''

  return PROMPT_CHAIN4_TEMPLATE
    .replace(/{episodeNumber}/g, episodeNumber)
    .replace('{demoInstruction}', demoInstruction)
    .replace('{assetList}', assetList || '(에셋 없음)')
    .replace('{scenesJson}', scenesJson)
}
