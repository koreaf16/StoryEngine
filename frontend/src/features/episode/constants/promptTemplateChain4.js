/**
 * @file promptTemplateChain4.js
 * @description Chain 4 — 이미지 프롬프트 생성 템플릿. Flux용 5블록 구조.
 * @usage buildPromptChain4.js에서 사용.
 * @connects features/episode/utils/buildPromptChain4.js
 * @doc docs/05-episode.md (Chain 4: 이미지 프롬프트)
 */

export const PROMPT_CHAIN4_TEMPLATE = `아래 씬·샷 설계를 바탕으로 에피소드 {episodeNumber}의 각 샷에 대한 Flux 이미지 프롬프트를 생성하라.
JSON 배열만 출력하고 다른 텍스트는 넣지 마라.

{demoInstruction}

이미지 프롬프트 규칙 (render_prompt 세밀화):
- 5블록 구조 유지: [Camera/Lens] | [Subject/Action] | [Environment/Space] | [Lighting] | [Aesthetics/Grading]
- [Camera/Lens]: 구체적 화각(mm), 조리개(f값), 렌즈 특성 포함
- [Subject/Action]: 에셋 trigger word 또는 display_name, 정확한 포즈·표정·동작
- [Environment/Space]: 배경 디테일, 원근감, 공간감
- [Lighting]: 광원 방향·색온도·강도·그림자 특성
- [Aesthetics/Grading]: 영화 레퍼런스, 색조, 질감, 화면 비율
- LoRA 에셋은 trigger_word를 [Subject/Action] 앞에 추가하라 (예: "trigger_word, standing, arms crossed")
- controlnet_guide: "depth" / "pose" / "canny" / "none" 중 권장 방식

출력 JSON 형식:
[
  {
    "scene_number": 1,
    "shot_number": 1,
    "render_prompt": "[Camera/Lens] 35mm prime f/1.8, medium close-up | [Subject/Action] character_name, turning slowly, pensive expression | [Environment/Space] abandoned library, dusty shelves, shallow depth of field | [Lighting] soft window light from left, long shadow on floor | [Aesthetics/Grading] cinematic 2.39:1, desaturated teal-orange, film grain",
    "controlnet_guide": "depth"
  }
]

=== 에셋 목록 ===
{assetList}

=== 씬·샷 설계 ===
{scenesJson}`
