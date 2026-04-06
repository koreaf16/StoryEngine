/**
 * @file buildPromptD2.js
 * @description 프롬프트 D2(에피소드 대본/대사 생성) 조립 유틸. 골격 + 캐릭터 프로필로 프롬프트 생성.
 * @usage SkeletonPromptPage에서 골격 완료 후 호출.
 * @connects features/episode/constants/promptTemplateD2.js
 * @doc docs/05-episode.md (대본 생성 — 프롬프트 D2)
 */
import { PROMPT_D2_TEMPLATE } from '../constants/promptTemplateD2.js'

export default function buildPromptD2({ episodeNumber, scenes, assets }) {
  const skeletonJson = JSON.stringify(
    scenes.map((s) => ({
      scene_number: s.scene_number,
      title: s.title,
      core_event: s.core_event,
      mood: s.mood,
      tension_level: s.tension_level,
      characters: s.characters,
      color_palette: s.color_palette || '',
      emotional_bridge: s.emotional_bridge || '',
    })),
    null,
    2
  )

  const characterProfiles = assets
    .filter((a) => a.asset_type === 'CHARACTER' || a.asset_type === 'NPC')
    .map((a) => {
      const lines = [`[${a.asset_id}] ${a.display_name} (${a.asset_type})`]
      if (a.personality?.core_trait) lines.push(`  성격: ${a.personality.core_trait}`)
      if (a.personality?.emotional_pattern) lines.push(`  감정 패턴: ${a.personality.emotional_pattern}`)
      if (a.speech_style?.tone) lines.push(`  말투 톤: ${a.speech_style.tone}`)
      if (a.speech_style?.sentence_length) lines.push(`  문장 길이: ${a.speech_style.sentence_length}`)
      if (a.speech_style?.habit_phrases?.length) lines.push(`  습관 표현: ${a.speech_style.habit_phrases.join(', ')}`)
      if (a.backstory?.wound) lines.push(`  상처: ${a.backstory.wound}`)
      if (a.backstory?.desire) lines.push(`  욕망: ${a.backstory.desire}`)
      return lines.join('\n')
    })
    .join('\n\n')

  return PROMPT_D2_TEMPLATE
    .replace('{episodeNumber}', episodeNumber)
    .replace('{skeletonJson}', skeletonJson)
    .replace('{characterProfiles}', characterProfiles || '(캐릭터 프로필 없음)')
}
