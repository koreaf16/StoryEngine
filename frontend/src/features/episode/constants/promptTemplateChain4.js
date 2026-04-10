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

핵심: render_prompt는 이미지 AI(Flux)에 직접 전달되는 최종 프롬프트다.
후처리/래핑 없이 그대로 사용된다. 프롬프트 품질 = 이미지 품질.

프롬프트 스타일 규칙:
- 자연어 문장 스타일로 작성하라. 태그 나열식(tag list) 금지.
- 목표 길이: 80~150 단어 (너무 짧으면 디테일 부족, 너무 길면 중요 요소 희석)
- 절대 사용 금지: "8k", "masterpiece", "best quality", "ultra-realistic", "sharp focus", "raw photo", "dslr", "natural lighting"
  → 이런 태그는 SD1.5 시대의 유물이며 Flux 모델은 무시한다
- 영화/사진 레퍼런스 권장: 촬영감독, 감독, 영화 제목으로 미학 방향 지정
  (예: "Roger Deakins' cinematography in Blade Runner 2049", "Chivo Lubezki's naturalistic long-take aesthetic")

5블록 구조 (render_prompt):
[Camera/Lens] | [Subject/Action] | [Environment/Space] | [Lighting] | [Aesthetics/Grading]

각 블록 상세:
- [Camera/Lens]: 구체적 화각(mm), 조리개(f값), 렌즈 특성, 심리적 의도까지 반영
  예: "85mm anamorphic f/1.4, tight medium close-up, shallow depth of field isolating subject from environment"

- [Subject/Action]: 에셋 trigger_word 또는 display_name을 주어로, 포즈·표정·동작·감정을 자연어로 묘사
  - LoRA 에셋: trigger_word를 이 블록 앞에 추가 (예: "sora_char, standing with arms crossed, jaw tightly clenched")
  - 다중 주체 분리 규칙 (Subject Separation):
    한 프레임에 2명 이상일 때 반드시 " / "로 공간적 위치를 분리하여 각각 독립 기술
    (예: "sora_char on the left, reaching forward / rabbit_char crouching on the right, ears flattened")
    절대 금지: "A and B together" 같은 뭉뚱그린 묘사 → 속성 혼합(merging) 발생

- [Environment/Space]: 최소 2문장. "a room" 한 단어로 끝내지 마라.
  - 전경/중경/원경 레이어 분리로 공간 깊이감 기술
  - 대기 효과(안개, 먼지, 연기), 질감(벽의 금, 바닥의 이끼), 소품 배치 포함
  - 씬의 color_palette와 mood를 환경 묘사에 녹여라
  예: "narrow medieval alleyway paved with rain-slicked cobblestones, crumbling stone walls covered in dark moss, a broken lantern hanging at the far end casting a faint orange glow through heavy fog"

- [Lighting]: 광원 방향·색온도·강도·그림자 특성을 영화적으로 기술. "natural lighting" 금지.
  예: "cool desaturated daylight from overcast sky overhead, single warm amber practical torch on the left wall creating dramatic cross-shadow, faint rim light separating subject from dark background"

- [Aesthetics/Grading]: 씬의 color_palette를 여기에 반영하라. 색조, 질감, 필름 스타일, 비율.
  예: "desaturated teal shadows with isolated warm amber highlights, heavy atmospheric haze, subtle 35mm film grain, 2.39:1 cinematic letterbox framing, inspired by Vilmos Zsigmond's naturalistic style"

나쁜 render_prompt 예시 (하지 마라):
"[Camera/Lens] 35mm, medium shot | [Subject/Action] character standing | [Environment/Space] a room | [Lighting] soft light | [Aesthetics/Grading] cinematic, 8k, masterpiece, best quality, ultra-realistic"
→ 이유: 태그 나열, 구체성 없음, 60단어 미만, 금지 품질 태그

좋은 render_prompt 예시 (이렇게 하라):
"[Camera/Lens] 50mm prime f/2.0, eye-level medium shot, slight dutch angle conveying unease | [Subject/Action] sora_char on the left, leaning against weathered stone doorframe with one hand gripping a crumpled letter, brow furrowed, rain-dampened dark coat clinging to shoulders / horned_rabbit crouching low on the right, ears pressed back, glowing eyes fixed upward with wary attention | [Environment/Space] narrow medieval alley at night, cobblestones glistening under rain, crumbling stone walls with dark moss, a stray cat frozen mid-step in background shadows, distant torch glow diffusing through heavy fog | [Lighting] cool blue ambient from overcast sky, single warm torch practical from far left creating dramatic cross-lighting, soft water reflections from puddles below | [Aesthetics/Grading] muted earth tones with isolated warm amber from torchlight, heavy atmospheric haze, Vilmos Zsigmond-inspired naturalistic grain, 2.39:1 anamorphic framing"

- controlnet_guide: "depth" / "pose" / "canny" / "none" 중 권장 방식

출력 JSON 형식:
[
  {
    "scene_number": 1,
    "shot_number": 1,
    "render_prompt": "[Camera/Lens] ... | [Subject/Action] ... | [Environment/Space] ... | [Lighting] ... | [Aesthetics/Grading] ...",
    "controlnet_guide": "depth"
  }
]

=== 에셋 목록 ===
{assetList}

=== 씬·샷 설계 ===
{scenesJson}`
