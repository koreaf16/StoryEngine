/**
 * @file parseProfileJson.js
 * @description LLM 응답에서 캐릭터 프로필 JSON을 추출하고 검증하는 유틸리티.
 * @usage CharacterPromptPage.jsx의 handleLLMSubmit에서 호출.
 * @connects features/character/pages/CharacterPromptPage.jsx
 * @doc docs/03-character-setup.md (캐릭터 프로필 데이터 구조)
 */

export default function parseProfileJson(rawText) {
  // 1. JSON 객체 추출 (가장 바깥 { } 블록)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('JSON 객체를 찾을 수 없습니다. LLM 응답에 { ... } 형식의 JSON이 포함되어야 합니다.')
  }

  // 2. JSON 파싱
  let parsed
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    throw new Error(`JSON 파싱 실패: ${e.message}`)
  }

  // 3. 구조 정규화 + 빈 필드 기본값 처리
  const profile = {
    personality: {
      core_trait: parsed.personality?.core_trait || '',
      emotional_pattern: parsed.personality?.emotional_pattern || '',
      soft_spot: parsed.personality?.soft_spot || '',
    },
    speech_style: {
      sentence_length: parsed.speech_style?.sentence_length || '',
      habit_phrases: Array.isArray(parsed.speech_style?.habit_phrases)
        ? parsed.speech_style.habit_phrases
        : [],
      tone: parsed.speech_style?.tone || '',
      speech_level: parsed.speech_style?.speech_level || '',
    },
    backstory: {
      wound: parsed.backstory?.wound || '',
      desire: parsed.backstory?.desire || '',
      fear: parsed.backstory?.fear || '',
    },
    behavioral_rules: Array.isArray(parsed.behavioral_rules)
      ? parsed.behavioral_rules
      : [],
  }

  // 4. 최소 내용 검사
  const hasContent =
    profile.personality.core_trait ||
    profile.backstory.wound ||
    profile.behavioral_rules.length > 0
  if (!hasContent) {
    throw new Error('프로필 내용이 부족합니다. personality.core_trait 또는 backstory.wound 중 하나 이상 필요합니다.')
  }

  return profile
}
