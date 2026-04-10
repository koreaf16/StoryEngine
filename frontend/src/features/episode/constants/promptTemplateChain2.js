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

핵심 원칙: 각 샷은 개별 영상 클립(video clip)의 시작 프레임이 된다.
샷 수 = 영상 클립 수. 씬의 대표 이미지를 만드는 게 아니라, 실제 영화/드라마 편집 밀도로 설계하라.

씬 설계 원칙:
- 감정이 바뀌는 지점에서 씬을 분할하라.
- tension_level로 기승전결 감정 곡선을 구성하라.
- color_palette는 씬 감정과 일치시켜라.

샷 밀도 규칙 (shot density):
- 대사 기반: 각 대사(dialogue line) = 최소 2샷 (화자 샷 + 리액션 샷)
- 씬 진입: 반드시 establishing shot 또는 two-shot으로 시작
- 씬 종료: 마무리 샷 1개 (감정 여운 또는 다음 씬 연결)
- 최소 공식: shots_per_scene >= (대사 수 × 2) + 3 (establishing + transition + closing)
- 대사 없는 액션/풍경 씬: 동작 단위로 분할, 최소 5샷

대화 연출 패턴 (framing sequence):
- 씬 진입 → two-shot (두 인물의 위치 관계 확립)
- 말하는 사람 → OTS(over-the-shoulder) 또는 medium close-up
- 반응하는 사람 → reaction close-up (표정 변화)
- 클라이맥스 → extreme close-up (눈, 손, 소도구)
- 단조롭지 않게 변주하되, 패턴의 흐름은 유지하라

숏 리듬 원칙 (shot rhythm):
- 균일한 컷(5초-5초-5초)은 금지. 완급 조절이 필수.
- 긴장 가속: 6초→4초→3초→2초 (점점 빠르게)
- 해소 감속: 2초→3초→5초→8초 (점점 느리게)
- duration_sec은 대사 길이와 리듬 원칙을 함께 고려하라

샷 설계 세부 원칙:
- render_prompt는 5블록 구조로 작성하라 (영문):
  [Camera/Lens] 화각·렌즈 | [Subject/Action] 인물·동작 | [Environment/Space] 장소·공간 | [Lighting] 조명 | [Aesthetics/Grading] 미학
- 블록 사이는 " | " 로 구분하라.
- 블록 안에서는 comma separated descriptors를 사용하라.
- camera_motion: Static / Dolly In / Dolly Out / Pan Left / Pan Right / Tilt Up / Tilt Down
- transition: cut / dissolve / fade_to_black
- dialogues: [{speaker_asset_id, text, emotion, timing_hint}] — 없으면 []
- sfx: ["설명 문자열"] 배열 — 없으면 []
- framing_rationale: 이 구도를 선택한 심리적/서사적 이유 (예: "low angle — 권위감 강조")
- rhythm_note: 편집 템포 의도 (예: "앞 빠른 컷 후 이 샷에서 숨 고르기")

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
