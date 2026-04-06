/**
 * @file promptTemplateChain5.js
 * @description Chain 5 — 영상 프롬프트 생성 템플릿. Wan2.2 I2V용.
 * @usage buildPromptChain5.js에서 사용.
 * @connects features/episode/utils/buildPromptChain5.js
 * @doc docs/05-episode.md (Chain 5: 영상 프롬프트)
 */

export const PROMPT_CHAIN5_TEMPLATE = `아래 씬·샷 정보를 바탕으로 에피소드 {episodeNumber}의 각 샷에 대한 Wan2.2 I2V 영상 프롬프트를 생성하라.
JSON 배열만 출력하고 다른 텍스트는 넣지 마라.

{demoInstruction}

영상 프롬프트 규칙:
- video_prompt는 영어로 작성하라.
- 카메라 움직임: 구체적 속도와 방향 포함 (예: "camera slowly dolls in over 4 seconds")
- 인물/오브젝트 모션: 미묘한 움직임도 기술 (예: "character's hair sways gently", "hand trembles slightly")
- 환경 모션: 배경의 자연스러운 움직임 (예: "dust particles float in shaft of light")
- chain_last_frame: 이 샷의 마지막 프레임이 다음 샷의 시작 이미지로 이어지면 true
- duration_sec: 기존 설계값 유지 권장 (조정 가능)
- fps: 24 또는 30 권장

출력 JSON 형식:
[
  {
    "scene_number": 1,
    "shot_number": 1,
    "video_prompt": "camera slowly dolls in, character breathes steadily, fabric rustles in faint wind, candle flame flickers",
    "duration_sec": 4.0,
    "fps": 24,
    "chain_last_frame": false
  }
]

=== 씬·샷 설계 ===
{scenesJson}`
