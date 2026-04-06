/**
 * @file buildPromptE.js
 * @description 프롬프트 E(씬별 샷 생성) 조립 유틸. 씬 골격 + 등장 에셋 + D2 대사로 프롬프트 생성.
 * @usage SkeletonPromptPage에서 씬별로 호출.
 * @connects features/episode/constants/promptTemplates.js
 * @doc docs/05-episode.md (3. 씬별 샷 생성 — 프롬프트 E)
 */
import { PROMPT_E_TEMPLATE } from '../constants/promptTemplates.js'

export default function buildPromptE({ episodeNumber, scene, assets, previousShots = null, sceneDialogues = null }) {
  const sceneData = JSON.stringify({
    scene_number: scene.scene_number,
    title: scene.title,
    location_asset: scene.location_asset,
    characters: scene.characters,
    core_event: scene.core_event,
    mood: scene.mood,
    tension_level: scene.tension_level,
  }, null, 2)

  const relevantAssets = assets.filter(
    (a) => scene.characters?.includes(a.asset_id) || a.asset_id === scene.location_asset
  )

  const assetDetails = relevantAssets
    .map((a) => {
      const outfitLine = a.outfit_prompt ? `\n  outfit: ${a.outfit_prompt}` : ''

      let profileLine = ''
      if (a.personality?.core_trait) {
        profileLine += `\n  personality: ${a.personality.core_trait}`
        if (a.personality.emotional_pattern) profileLine += ` / ${a.personality.emotional_pattern}`
      }
      if (a.backstory?.wound) {
        profileLine += `\n  inner_conflict: ${a.backstory.wound}`
      }
      if (a.speech_style?.tone) {
        profileLine += `\n  speech_tone: ${a.speech_style.tone}`
      }

      return `[${a.asset_id}] ${a.display_name} (${a.asset_type})\n  appearance: ${a.appearance_prompt || '(없음)'}${outfitLine}${profileLine}\n  strategy: ${a.visual_strategy}`
    })
    .join('\n\n')

  // 이전 씬 마지막 3샷
  const previousSceneContext = previousShots
    ? previousShots.slice(-3).map((s) => {
        const dialogueSummary = Array.isArray(s.dialogues) && s.dialogues.length
          ? `\n  dialogue: ${s.dialogues.map((d) => `${d.speaker_asset}: "${d.text}"`).join(' / ')}`
          : ''
        const noteLine = s.narrative_note ? `\n  narrative: ${s.narrative_note}` : ''
        return `[Shot ${s.shot_number}] ${s.render_prompt}\n  mood: ${s.bgm_mood || ''}, transition: ${s.transition || ''}${dialogueSummary}${noteLine}`
      }).join('\n')
    : '(에피소드 첫 씬)'

  // D2 대사 목록 — 없으면 빈 안내 메시지
  const dialoguesText = sceneDialogues && sceneDialogues.length > 0
    ? JSON.stringify(sceneDialogues.map((d) => ({
        order_index: d.order_index,
        speaker_asset: d.speaker_asset,
        text: d.text,
        emotion: d.emotion,
        intensity: d.intensity,
        timing_hint: d.timing_hint,
        dialogue_visual_rel: d.dialogue_visual_rel,
        acting_direction: d.acting_direction,
      })), null, 2)
    : '(대본 미생성 — 대사 없는 씬이거나 D2 미실행)'

  return PROMPT_E_TEMPLATE
    .replace('{episodeNumber}', episodeNumber)
    .replace('{sceneNumber}', scene.scene_number)
    .replace('{sceneTitle}', scene.title)
    .replace('{previousSceneContext}', previousSceneContext)
    .replace('{transitionFromPrev}', scene.transition_from_prev || '(정보 없음)')
    .replace('{tensionLevel}', scene.tension_level ?? '?')
    .replace('{colorPalette}', scene.color_palette || '(미설정)')
    .replace('{colorPalette}', scene.color_palette || '(미설정)')
    .replace('{keyObject}', scene.key_object || '(없음)')
    .replace('{keyObjectState}', scene.key_object_state || '(없음)')
    .replace('{connectionDevice}', scene.connection_device || '(미설정)')
    .replace('{emotionalBridge}', scene.emotional_bridge || '(정보 없음)')
    .replace('{sceneData}', sceneData)
    .replace('{sceneDialogues}', dialoguesText)
    .replace('{assetDetails}', assetDetails || '(에셋 정보 없음)')
}
