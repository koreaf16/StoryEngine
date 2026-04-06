# 09. Export JSON 계약

## 목적

에피소드 확정 후 Video Factory(Wan 2.2 파이프라인)로 전달되는 최종 지시서. 이 JSON 하나로 Video Factory가 영상 렌더링을 시작할 수 있어야 한다.

## 최상위 구조

```json
{
  "schema_version": "1.0",
  "project_id": "P_001",
  "episode_number": 1,
  "episode_title": "비레 항구의 검객",
  "overall_mood": "dark and melancholic orchestral",
  "world_progression": {
    "npc_updates": [
      {
        "name": "상인 보록",
        "asset_id": "npc_borok",
        "activity": "카이에게 잿빛 숲 정보 제공 후 약초 정리 중",
        "new_state": "카이와 안면 있음"
      }
    ]
  },
  "shots": [ ... ]
}
```

## 샷 구조

```json
{
  "shot_number": 4,
  "scene_ref": "scene_2",
  "duration_sec": 4,
  "transition": "cut",
  "snap_image_path": "/images/ep01/shot_04.png",
  
  "visual_task": {
    "render_engine": "Wan_2.2_I2V",
    "render_prompt": "dark misty forest clearing, kai_char drawing a pulsating crimson crystal greatsword from back sheath, red ethereal glow illuminating fog...",
    "camera_motion": "Dolly In",
    "lora_requirements": [
      {
        "trigger_word": "kai_char",
        "path": "/models/loras/kai_v1.safetensors",
        "weight": 0.8,
        "fallback_prompt": "young male swordsman in dark leather armor, long black hair, scar on left cheek"
      }
    ]
  },
  
  "audio_task": {
    "dialogues": [
      {
        "speaker": "카이",
        "speaker_asset_id": "char_kai",
        "text": "네가 마지막이다.",
        "emotion_tag": "cold",
        "tts_voice_id": "voice_m_husky_01",
        "tts_file_path": "/tts/ep01/shot04_dial01.wav",
        "apply_lipsync": true
      }
    ],
    "bgm_mood": "dark orchestral tension",
    "sound_effects": [
      "sword_unsheathe_metal",
      "sfx_crystal_pulse_01",
      "sfx_shadow_wolf_growl_01"
    ]
  },
  
  "narrative_note": "카이의 결의가 드러나는 전환점. 혈석검의 붉은 빛이 처음으로 강하게 발현."
}
```

## 필드 상세

### 최상위

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| schema_version | string | O | JSON 스키마 버전. Video Factory가 구버전/신버전 구별 |
| project_id | string | O | 프로젝트 ID |
| episode_number | number | O | 회차 번호 |
| episode_title | string | O | 에피소드 제목 |
| overall_mood | string | O | 전체 분위기 태그 |
| world_progression | object | O | NPC 상태 변화 기록 |
| shots | array | O | 샷 배열 (순서대로) |

### visual_task

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| render_engine | string | O | "Wan_2.2_I2V" (고정) |
| render_prompt | string | O | 영어 영상 렌더링 프롬프트 |
| camera_motion | string | O | Static / Dolly In / Pan Left / Tilt Up |
| lora_requirements | array | X | LoRA 바인딩 정보 (LORA 전략인 에셋만) |

### lora_requirements 항목

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| trigger_word | string | O | LoRA 트리거 워드 |
| path | string | O | LoRA 파일 경로 |
| weight | number | O | LoRA 가중치 (기본 0.8) |
| fallback_prompt | string | O | LoRA 로드 실패 시 텍스트 대체 묘사 |

### audio_task

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| dialogues | array | X | 대사 배열 (없는 샷도 있음) |
| bgm_mood | string | O | 배경음악 분위기 태그 |
| sound_effects | array | X | 효과음 목록 |

### dialogues 항목

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| speaker | string | O | 화자 표시명 |
| speaker_asset_id | string | O | 화자 에셋 ID |
| text | string | O | 대사 텍스트 |
| emotion_tag | string | O | 감정 (cold, cheerful, sad 등) |
| tts_voice_id | string | O | TTS 음성 ID |
| tts_file_path | string | O | 생성된 TTS 파일 경로 |
| apply_lipsync | boolean | O | 립싱크 적용 여부 |

### 샷 레벨

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| shot_number | number | O | 샷 번호 (에피소드 내 순번) |
| scene_ref | string | O | 소속 씬 ID |
| duration_sec | number | O | 목표 길이 (초) |
| transition | string | O | cut / dissolve / fade_to_black |
| snap_image_path | string | O | 스냅 이미지 파일 경로 |
| narrative_note | string | X | 서사적 의미 (벡터 DB 저장용) |

## 검증 규칙

Export JSON 조립 시 ajv로 스키마 검증:

1. 모든 필수 필드 존재 여부
2. camera_motion이 허용 목록 내 값인지
3. transition이 허용 목록 내 값인지
4. duration_sec이 양수인지
5. 대사가 있는 샷에 tts_file_path가 채워져 있는지
6. lora_requirements의 path가 실제 파일 경로인지
7. 모든 speaker_asset_id가 DB에 등록된 에셋인지

## PROMPT 전략 에셋의 표현

LoRA가 없는 에셋은 lora_requirements에 포함되지 않는다. 대신 render_prompt에 해당 에셋의 appearance_prompt가 텍스트로 합쳐져 있다. Video Factory는 lora_requirements 배열만 보고 LoRA를 로드하면 되고, 나머지는 render_prompt의 텍스트 묘사로 처리된다.
