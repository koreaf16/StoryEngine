/**
 * @file promptTemplates.js
 * @description 캐릭터 프로필 생성용 프롬프트 C 템플릿.
 * @usage buildPromptC.js에서 변수 치환 후 사용.
 * @connects features/character/utils/buildPromptC.js
 * @doc docs/03-character-setup.md (방식 A: LLM 협업 생성)
 */

export const PROMPT_C_TEMPLATE = `다음 세계관에서 캐릭터 '{{characterName}}'의 상세 프로필을 JSON으로 작성해라.
JSON만 출력하고 다른 텍스트는 쓰지 마라.

포함할 항목:
- personality: { core_trait, emotional_pattern, soft_spot }
- speech_style: { sentence_length, habit_phrases (배열), tone, speech_level }
- backstory: { wound, desire, fear }
- behavioral_rules: [문자열 배열, 3~5개]

출력 형식:
{
  "personality": {
    "core_trait": "핵심 성격 특성",
    "emotional_pattern": "감정 표현 방식",
    "soft_spot": "약한 부분"
  },
  "speech_style": {
    "sentence_length": "문장 길이 특성",
    "habit_phrases": ["말버릇1", "말버릇2"],
    "tone": "톤/분위기",
    "speech_level": "존댓말/반말 규칙"
  },
  "backstory": {
    "wound": "핵심 상처",
    "desire": "욕구",
    "fear": "두려움"
  },
  "behavioral_rules": [
    "규칙1",
    "규칙2",
    "규칙3"
  ]
}

=== {{characterName}} 기본 정보 ===
이름: {{characterName}}
타입: {{assetType}}
음성 특성: {{voiceHint}}
외형: {{appearancePrompt}}

=== 세계관 맥락 ===
{{worldBackbone}}`
