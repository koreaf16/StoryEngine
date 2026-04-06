/**
 * @file promptTemplateChain2.js
 * @description Chain 2 — 씬·샷 설계 프롬프트 템플릿. 소설 텍스트 기반으로 씬+샷 통합 JSON 생성.
 * @usage buildPromptChain2.js에서 사용.
 * @connects features/episode/utils/buildPromptChain2.js
 * @doc docs/05-episode.md (Chain 2: 씬·샷 설계)
 */

export const PROMPT_CHAIN2_TEMPLATE = `아래 소설 텍스트를 바탕으로 에피소드 {episodeNumber}의 씬과 샷을 동시에 설계하라.
JSON 배열만 출력하고 다른 텍스트는 넣지 마라.

{demoInstruction}

씬 설계 원칙:
- 감정이 바뀌는 지점에서 씬을 분할하라.
- tension_level로 기승전결 감정 곡선을 구성하라.
- color_palette는 씬 감정과 일치시켜라.

샷 설계 원칙:
- render_prompt는 5블록 구조로 작성하라 (영문):
  [Camera/Lens] 화각·렌즈 | [Subject/Action] 인물·동작 | [Environment/Space] 장소·공간 | [Lighting] 조명 | [Aesthetics/Grading] 미학
- 블록 사이는 " | " 로 구분하라.
- 블록 안에서는 comma separated descriptors를 사용하라.
- camera_motion: Static / Dolly In / Dolly Out / Pan Left / Pan Right / Tilt Up / Tilt Down
- transition: cut / dissolve / fade_to_black
- dialogues: [{speaker_asset_id, text, emotion, timing_hint}] — 없으면 []
- sfx: ["설명 문자열"] 배열 — 없으면 []

출력 JSON 형식:
[
  {
    "scene_number": 1,
    "title": "씬 제목",
    "location_asset": "loc_asset_id",
    "characters": ["asset_id"],
    "core_event": "핵심 사건 한 줄",
    "mood": "분위기",
    "tension_level": 7,
    "color_palette": "warm amber, crimson accents",
    "key_object": "상징 오브젝트",
    "connection_device": "match_cut",
    "shots": [
      {
        "shot_number": 1,
        "render_prompt": "[Camera/Lens] ... | [Subject/Action] ... | [Environment/Space] ... | [Lighting] ... | [Aesthetics/Grading] ...",
        "camera_motion": "Static",
        "duration_sec": 4.0,
        "transition": "cut",
        "dialogues": [],
        "bgm_mood": "tense strings",
        "sfx": [],
        "narrative_note": "연출 메모",
        "framing_rationale": "이 구도를 선택한 이유",
        "rhythm_note": "편집 템포 메모"
      }
    ]
  }
]

=== 사용 가능한 에셋 ===
{assetList}

=== 소설 텍스트 ===
{novelText}`
