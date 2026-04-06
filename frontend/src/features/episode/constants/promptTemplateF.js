/**
 * @file promptTemplateF.js
 * @description 프롬프트 F(씬별 사운드 설계) 템플릿. 4레이어 오디오 아키텍처.
 * @usage buildPromptF.js에서 import하여 프롬프트 조립.
 * @connects features/episode/utils/buildPromptF.js
 * @doc docs/05-episode.md (프롬프트 F 구조)
 */

export const PROMPT_F_TEMPLATE = `에피소드 {episodeNumber}, 씬 {sceneNumber} "{sceneTitle}"의 사운드 디자인을 만들어라.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【4레이어 오디오 아키텍처】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layer 4  내레이션/대사 (TTS)          ← 볼륨 기준점
Layer 3  음악 (스코어/BGM)
Layer 2  폴리/효과음 (SFX)
Layer 1  앰비언스 (공간음)             ← 항상 존재해야 함

4개를 별도로 설계하라. 하나로 합치면 양산형이 된다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【음악 설계 원칙】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 가장 강렬한 순간에 음악을 빼는 것이 아마추어와 프로의 차이다.
- 무음 구간의 위치와 이유를 반드시 명시하라.
- 스웰(swell) 포인트: 음악이 최고조에 달하는 순간을 샷 번호와 함께 명시.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【TTS 연기 디렉션 원칙】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 속도는 기본보다 살짝 느리게 (0.75~0.95배). 서두르면 유튜브 설명 영상이 된다.
- 대사 앞뒤 침묵(gap)을 설계하라. 간격이 없으면 내레이션 영상이 된다.
- acting_note는 TTS 엔진이 처리할 수 있는 구체적 톤/감정 지시를 적어라.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【사운드 브릿지 원칙】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다음 씬의 소리를 현재 씬 마지막 1~2초에 미리 깔거나,
현재 씬의 소리가 다음 씬 시작까지 이어지게 하라.
이것 하나로 편집 퀄리티가 확 달라진다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【출력 형식】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
단일 JSON 객체로 출력:

{
  "scene_number": N,
  "ambience": "씬 전체에 깔리는 공간음 (구체적으로 — 예: '항구의 낮 — 파도 소리, 갈매기, 나무 삐걱거림')",
  "music_segments": [
    {
      "shot_range": [시작샷번호, 끝샷번호],
      "mood": "음악 무드 영문 묘사 (예: 'tense strings with low brass undercurrent')",
      "intensity": 1~10,
      "swell_point": "최고조 순간 (예: 'shot 3 중반 — 검을 뽑는 순간') 또는 null",
      "silence_point": "무음 구간 (예: 'shot 4 시작 — 대사 직전 0.5초 완전 무음') 또는 null"
    }
  ],
  "foley_map": [
    {
      "shot_number": N,
      "sfx": ["효과음 목록 (영문 키워드)"],
      "sync_note": "동기화 시점 설명"
    }
  ],
  "design_sfx": [
    {
      "shot_number": N,
      "sfx": "감정/분위기 SFX (영문 키워드)",
      "purpose": "이 효과음이 하는 감정적 역할"
    }
  ],
  "sound_bridges": "다음 씬으로의 오디오 전환 설계 (구체적으로)",
  "tts_direction": [
    {
      "dialogue_index": N (order_index),
      "speed": 0.75~1.0,
      "pre_gap_ms": N (대사 전 침묵 ms),
      "post_gap_ms": N (대사 후 침묵 ms),
      "acting_note": "TTS 연기 구체적 지시"
    }
  ],
  "mix_balance": {
    "narration_db": 0 (기준점),
    "music_db": -12~-18,
    "sfx_db": -6~-10,
    "ambience_db": -20~-24,
    "exceptions": "특정 샷에서의 예외 (예: 'shot 3: sfx -3으로 올림, music -20으로 낮춤')"
  }
}

JSON 외 다른 텍스트 없이.

=== 씬 골격 ===
{sceneData}
=== 씬 샷 목록 ===
{shotsJson}
=== 씬 대사 목록 ===
{dialoguesJson}
=== 에피소드 컬러 흐름 참고 ===
{colorScript}`
