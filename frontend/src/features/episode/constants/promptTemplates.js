/**
 * @file promptTemplates.js
 * @description 에피소드 생성용 프롬프트 D(골격), E(씬별 샷) 템플릿.
 * @usage buildPromptD.js, buildPromptE.js에서 import하여 프롬프트 조립.
 * @connects features/episode/utils/buildPromptD.js, buildPromptE.js
 * @doc docs/05-episode.md (프롬프트 D, E 구조)
 */

export const PROMPT_D_TEMPLATE = `다음 세계관과 캐릭터를 바탕으로 에피소드 {episodeNumber}의 씬 구성을 만들어라.

씬 분할 원칙:
- 씬 개수에 제한을 두지 마라. 스토리가 요구하는 만큼 자유롭게 나눠라.
- 스토리의 서사 흐름에 따라 씬을 나눠라. 미리 정해진 틀에 스토리를 끼워 맞추지 마라.
- 장소가 아니라 감정이 바뀔 때 씬을 나눠라. 같은 방 안에서도 감정이 전환되면 새 씬이다.
- 영상미(시네마틱)를 고려하라. 장소 전환, 분위기 전환, 시간 경과, 긴장감 변화 등 영상 연출상 자연스러운 지점에서 씬을 나눠라.

각 씬마다:
- scene_number: 씬 번호
- title: 씬 제목
- location_asset: 장소 asset_id
- characters: 등장 에셋 asset_id 목록
- core_event: 핵심 사건 한 줄
- mood: 분위기
- tension_level: 긴장도 (1~10 정수). 에피소드 전체의 감정 곡선을 의식하여 설정하라.
- transition_from_prev: 이전 씬에서 어떻게 이어지는지 한 줄로 설명 (첫 씬은 "에피소드 시작")
- emotional_bridge: 이 씬의 감정이 다음 씬으로 어떻게 넘어가는지 한 줄로 설명 (마지막 씬은 "에피소드 마무리")
- color_palette: 이 씬의 지배적 색감 (예: "desaturated blues and grays", "warm amber with crimson accents")
- key_object: 이 씬의 상징 오브젝트 (예: "깨진 나침반", "마르지 않는 촛불"). 에피소드 전체에서 반복·변주될 수 있는 소품을 선택하라.
- key_object_state: 오브젝트의 현재 상태 (예: "온전함", "금이 가기 시작", "산산조각")
- connection_device: 다음 씬과의 연결 방식 (match_cut / sound_bridge / motif_echo / hard_cut)

씬 간 연결 원칙:
- 각 씬은 독립적 에피소드가 아니라 하나의 감정 흐름의 일부다.
- tension_level로 에피소드 전체의 기승전결 곡선을 만들어라. 계속 높거나 계속 낮으면 안 된다.
- 씬 전환은 급격한 단절이 아니라, 감정의 잔향이 다음 씬의 시작에 스며들도록 설계하라.
- emotional_bridge는 다음 씬의 편집점 결정에 사용된다.
- 같은 오브젝트(key_object)가 3회 이상 변주되면 에피소드 전체의 모티프가 된다.
- 컬러 스크립트(color_palette)는 에피소드의 감정 곡선과 일치해야 한다.
  예: 희망 씬 → 골드/웜톤, 절망 씬 → 쿨블루/채도 낮음, 재생 씬 → 새벽 핑크/보라

사용 가능한 에셋 목록:
{assetList}

새 에셋이 필요하면 신규 asset_id를 만들어서 써라. (예: npc_새이름, loc_새장소)
JSON 배열로 출력.

=== 방향타 ===
{storyCompass}
=== 캐릭터 프로필 ===
{characterProfiles}
=== 기억 ===
{memory}
=== 사용자 힌트 ===
{userHint}`

export const PROMPT_E_TEMPLATE = `에피소드 {episodeNumber}, 씬 {sceneNumber} "{sceneTitle}"의 샷을 상세하게 만들어라.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【샷 분할 원칙】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 샷 개수에 제한을 두지 마라. 씬의 내용이 요구하는 만큼 자유롭게 만들어라.
- 영상미(시네마틱)를 우선하라: 분위기 전환, 카메라 앵글 변화, 감정 고조 등 영상 연출상 자연스러운 지점마다 샷을 나눠라.
- 액션 장면은 동작 단위로 세밀하게, 고요한 장면은 여백을 살려 적게 나눠라.
- tension_level을 의식하라: 10에 가까우면 빠른 컷과 짧은 샷(4~5초), 1에 가까우면 느린 카메라와 긴 호흡(6~8초).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【숏 리듬 원칙】 ← 양산형 영상과 시네마틱 영상의 차이
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 균일한 컷(5초-5초-5초)은 양산형이다. 완급 조절이 필수다.
  예: 긴장 고조 → 6초→4초→3초→2초 (가속) / 해소 → 2초→3초→5초→8초 (감속)
- "관객이 이해했다" 순간보다 0.5초 빠르게 자르면 긴장감, 1초 늦게 자르면 여운.
- 첫 샷: 충분히 길게(에스터블리싱), 마지막 샷: 길게(여운) 또는 매우 짧게(충격).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【render_prompt 5블록 구조】 ← 반드시 이 순서로 작성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
render_prompt는 Flux 이미지 생성 AI가 읽는 영어 프롬프트다.
반드시 아래 5블록을 이 순서로, 쉼표로 구분하여 한 줄로 작성하라:

[1. 카메라/렌즈] — 샷 사이즈 + 앵글 + 렌즈 특성
  extreme wide shot / wide shot / full shot / medium shot / medium close-up / close-up / extreme close-up
  + eye level / low angle (looking up) / high angle (looking down) / dutch angle
  + 35mm anamorphic lens / 85mm telephoto / 24mm wide / shallow depth of field / handheld sway 등

[2. 주체/행동] — 인물 배치 + 현재 동작 + 표정 (현재진행형으로)
  - 2명 이상: two-shot / over-the-shoulder (OTS) / group shot + 위치(foreground/background/left/right)
  - 표정: eyes wide with terror / clenched jaw / tears streaming / hollow stare / fierce cry
  - 동작: reaching out with trembling hand / gripping weapon / sprawled on ground

[3. 환경/공간] — 장소 + 대기 효과 + 질감
  - 대기: dust particles / rising smoke / heavy rain / morning mist / volumetric light rays
  - 질감: rough cobblestone / crumbling stone walls / moss-covered ruins / wet surface

[4. 조명] — 방향 + 색온도 + 강도
  golden hour / moonlight / candlelight / rim lighting / silhouette / overcast diffused light
  + warm amber tones / cool blue tones / desaturated gritty tones / high contrast

[5. 미학/그레이딩] — 색감 스타일 + 분위기 통일
  이 씬의 color_palette({colorPalette})를 반영하라.
  bleach bypass / film grain / anamorphic bokeh / cinematic 2.39:1 등

이미지 생성 AI는 이전 샷을 모른다. 각 render_prompt는 독립적으로 읽혀도 완결된 장면이어야 한다.
캐릭터의 현재 상태(외형, 의상, 표정)를 매 샷마다 충분히 서술하라.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【카메라 문법】 ← 카메라는 감정을 위해 움직인다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 달리 인(Dolly In): 발견, 긴장감 고조 → "camera slowly pushes in"
- 달리 아웃(Dolly Out): 상실, 고독 → "camera gradually pulls back"
- 핸드헬드: 불안, 혼돈 → "subtle handheld sway"
- 로우앵글 틸트업: 경외, 권위 → "low angle slowly tilting up"
- 오비탈: 반드시 감정적 이유가 있을 때만. 이유 없는 오비탈은 양산형 AI 영상의 클리셰다.
- 스태틱: 긴장, 감시, 여운 → 많은 시네마틱 장면은 카메라가 움직이지 않는다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【대사 배치 규칙】 ← 대사는 D2에서 이미 완성됨. 배치만 하라.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
아래 "이 씬의 대사 목록"에서 각 대사를 적절한 샷에 배치하라. 대사 텍스트를 수정하지 마라.

dialogue_visual_rel을 활용하여 구도를 결정하라:
- "complement" → 화자를 정면으로 보여주는 구도 (화자가 말하는 내용을 뒷받침)
- "contrast" → 화자가 아닌 다른 것을 보여주는 구도 (예: "괜찮아" 대사 + 떨리는 손 클로즈업)
- "extend" → 대사 후 여백 샷 (풍경, 오브젝트, 상대방 반응 — 대사가 담지 못한 감정)

대화 씬에서는 반드시 투샷/OTS/리액션 샷을 섞어라:
  · 씬 진입: two-shot으로 두 사람의 위치 관계 먼저 확립
  · 말하는 사람: OTS or medium close-up
  · 반응하는 사람: reaction close-up (표정 변화, 눈빛)
  · 감정 클라이맥스: extreme close-up (눈, 손, 오브젝트)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【스토리 연속성 규칙】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 캐릭터 감정 흐름: 이전 씬의 감정 상태를 이어받아 이 씬 안에서 변화시켜라.
- 물리적 연속성: 부상, 더러워진 옷, 들고 있는 물건이 샷마다 일관되어야 한다.
- 공간적 연속성(180도 규칙): 캐릭터 A가 왼쪽에 있었으면 이 씬에서도 왼쪽에.
- 이 씬의 첫 번째 샷은 이전 씬의 여운을 담아야 한다.
- 이 씬의 마지막 샷은 다음 씬으로의 감정적 여운을 남겨라 (emotional_bridge 참고).
- key_object({keyObject})가 등장한다면 현재 상태({keyObjectState})를 render_prompt에 반영하라.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【출력 형식】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
각 샷마다:
- shot_number: 샷 번호
- render_prompt: 5블록 구조 영어 프롬프트 (위 규칙 전부 포함)
- camera_motion: Static / Dolly In / Dolly Out / Pan Left / Pan Right / Tilt Up / Tilt Down 중 택1
- duration_sec: 4~8초 (숏 리듬 원칙 적용, 균일하게 만들지 말 것)
- transition: cut / dissolve / fade_to_black
- dialogues: 배치된 대사 목록 [{{ speaker_asset, text, emotion, dialogue_visual_rel }}]
  (D2에서 가져온 대사를 그대로 사용. text는 절대 수정하지 마라.)
- bgm_mood: 배경음악 분위기 한 줄
- sfx: 효과음 목록
- narrative_note: 서사적 의미 (이 샷이 이야기 전체에서 하는 역할)
- framing_rationale: 이 구도를 선택한 심리적 이유 (예: "low angle — 인물의 권위감 강조")
- rhythm_note: 샷 리듬 의도 (예: "앞 빠른 컷 후 이 샷에서 숨 고르기")
- connection_to_next: 다음 샷/씬과의 시각적 연결 (매치컷 기회, 오브젝트 연결 등)
- assigned_dialogue_indices: 이 샷에 배치된 대사의 order_index 목록 (예: [0, 1])

JSON 배열로 출력. JSON 외 다른 텍스트 없이.

=== 이전 씬 맥락 ===
{previousSceneContext}
=== 이 씬의 감정 흐름 ===
- 이전 씬에서의 연결: {transitionFromPrev}
- 이 씬의 긴장도: {tensionLevel}/10
- 색감: {colorPalette}
- 상징 오브젝트: {keyObject} ({keyObjectState})
- 다음 씬 연결 방식: {connectionDevice}
- 다음 씬으로의 감정 다리: {emotionalBridge}
=== 씬 골격 ===
{sceneData}
=== 이 씬의 대사 목록 (Prompt D2에서 생성됨 — 배치만 하라, 수정 금지) ===
{sceneDialogues}
=== 등장 에셋 (appearance/outfit/personality를 render_prompt에 반드시 반영할 것) ===
{assetDetails}`
