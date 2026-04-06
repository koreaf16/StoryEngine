/**
 * @file promptTemplates.js
 * @description 프롬프트 A(세계관 뼈대), 프롬프트 B(에셋 추출) 템플릿 문자열.
 * @usage buildPromptA.js, buildPromptB.js에서 사용자 입력을 삽입하여 프롬프트 생성.
 * @connects features/script/utils/buildPromptA.js, buildPromptB.js
 * @doc docs/02-script-input.md (Pass 1, Pass 2 프롬프트 내용)
 */

export const PROMPT_A_TEMPLATE = `아래 설정을 바탕으로 이 세계의 뼈대를 작성해라.

포함할 내용:
1. 세계관의 핵심 규칙 3~5개 (구체적으로)
2. 주인공의 내면 갈등과 외면 목표
3. 이야기가 향할 수 있는 큰 방향 2~3개 (확정이 아닌 가능성)
4. 시작 시점의 상황 묘사

에피소드별 줄거리는 쓰지 마라.

=== 사용자 제공 설정 ===
{{userInput}}`

export const PROMPT_B_TEMPLATE = `아래 세계관에서 모든 명명된 자산을 JSON으로 추출해라.
JSON만 출력하고 다른 텍스트는 쓰지 마라.

형식:
[
  {
    "asset_id": "타입_영문이름",
    "asset_type": "CHARACTER | NPC | LOCATION | ITEM | MONSTER",
    "display_name": "한글 표시명",
    "appearance_prompt": "영어 얼굴/피부/머리 외형 묘사 (Flux 렌더링용, 의상 제외)",
    "outfit_prompt": "영어 의상/장비/액세서리 묘사 (CHARACTER/NPC/MONSTER만 작성, 나머지는 null)",
    "audio_type": "TTS | SFX | NONE",
    "voice_hint": "음성 특성 한글 설명 (TTS인 경우)"
  }
]

outfit_prompt 작성 기준:
- CHARACTER/NPC: 평상시 착용 의상, 장비, 액세서리를 영어로 구체적으로 묘사 (예: "red hooded cloak, leather armor, silver sword at hip")
- MONSTER: 갑옷, 장식, 특수 외형 요소가 있으면 묘사, 없으면 null
- ITEM/LOCATION: null

=== 세계관 + 사용자 설정 ===
{{worldBackbone}}

{{userInput}}`
