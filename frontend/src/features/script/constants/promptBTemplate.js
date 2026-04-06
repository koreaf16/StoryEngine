/**
 * @file promptBTemplate.js
 * @description Prompt B template with explicit source block labels.
 * @usage Imported by buildPromptB.js.
 * @connects features/script/utils/buildPromptB.js
 * @doc docs/02-script-input.md
 */

export const PROMPT_B_TEMPLATE = `아래 컨텍스트에서 모든 명명된 자산을 JSON으로 추출하라.
JSON만 출력하고 다른 텍스트는 넣지 마라.

입력 블록 설명:
- [Prompt A World Backbone]: Pass 1에서 생성된 세계관 뼈대이다. 이 블록을 우선 기준으로 본다.
- [Original User Seed]: 사용자가 처음 입력한 원본 설정이다. Prompt A에서 빠진 명명 엔티티를 보완할 때만 사용한다.

자산은 위 두 블록에 실제 근거가 있을 때만 추출하고, 근거 없는 항목은 추가하지 마라.

appearance_prompt 작성 규칙 (모든 타입 필수, 영문):
- CHARACTER / NPC : 얼굴·두발·피부색·눈 묘사만. 복장·소품 제외. (Flux 증명사진용)
- LOCATION       : 장소 전체 분위기·지형·색감·조명. 캐릭터 언급 금지.
- ITEM           : 오브젝트 형태·재질·색상·크기감. 배경 언급 금지.
- MONSTER        : 체형·외피·색상·특징적 신체 부위 묘사.
appearance_prompt가 없거나 빈 문자열이면 해당 에셋은 무효 처리된다.

주인공(is_protagonist) 선택 규칙:
- 이야기를 이끌어가는 주요 CHARACTER에 "is_protagonist": true 표시.
- 주인공 수는 스토리가 요구하는 만큼 자유롭게 결정한다. 제한 없음.
- NPC, LOCATION, ITEM, MONSTER는 반드시 is_protagonist: false.
- is_protagonist: true인 캐릭터가 없으면 이후 캐릭터/비주얼 설정이 작동하지 않는다.

형식:
[
  {
    "asset_id": "stable_snake_case_id",
    "asset_type": "CHARACTER | NPC | LOCATION | ITEM | MONSTER",
    "display_name": "표시 이름",
    "appearance_prompt": "(필수) 위 규칙에 따른 영문 시각 묘사",
    "audio_type": "TTS | SFX | NONE",
    "voice_hint": "음성 특성 설명 (TTS일 때만, 없으면 빈 문자열)",
    "is_protagonist": false
  }
]

=== Input Blocks ===
[Prompt A World Backbone]
{{worldBackbone}}

[Original User Seed]
{{userInput}}`
