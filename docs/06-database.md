# 06. 데이터베이스 스키마 (Oracle 26ai)

## 테이블 목록

### projects — 프로젝트

| 컬럼 | 타입 | 설명 |
|------|------|------|
| project_id | VARCHAR2 PK | 프로젝트 고유 ID |
| title | VARCHAR2 | 프로젝트 제목 |
| genre | VARCHAR2 | 장르 |
| visual_style | VARCHAR2(30) | 비주얼 스타일 (PHOTOREALISTIC / CARTOON / ANIME / 3D_RENDER, 기본 PHOTOREALISTIC) |
| mood | VARCHAR2 | 분위기 |
| seed | CLOB | 사용자가 처음 입력한 자유 형식 씨앗 원문 |
| status | VARCHAR2 | SCRIPT_INPUT / CHARACTER / VISUAL / EPISODE |
| created_at | TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | 최종 수정일 |

### script_stage_snapshots — 스크립트 단계 원문 스냅샷

| 컬럼 | 타입 | 설명 |
|------|------|------|
| snapshot_id | VARCHAR2 PK | 스냅샷 고유 ID |
| project_id | VARCHAR2 FK | 프로젝트 ID |
| stage_key | VARCHAR2 | PROMPT_A / PROMPT_B |
| prompt_text | CLOB | 당시 사용자에게 보여준 프롬프트 원문 |
| response_text | CLOB | 사용자가 붙여넣은 LLM 응답 원문 |
| parsed_json | CLOB | 마지막 파싱 성공 결과(JSON 직렬화) |
| parse_error | CLOB | 마지막 파싱 실패 메시지 |
| created_at | TIMESTAMP | 생성일 |
| updated_at | TIMESTAMP | 최종 수정일 |

### project_config — 프로젝트별 설정

| 컬럼 | 타입 | 설명 |
|------|------|------|
| project_id | VARCHAR2 PK/FK | 프로젝트 ID |
| face_threshold | NUMBER | 얼굴 유사도 임계값 (기본 0.4) |
| rag_top_k | NUMBER | 벡터 검색 top-k (기본 5) |
| derivative_count | NUMBER | 파생 이미지 프리셋 수 (기본 15) |
| lora_training_steps | NUMBER | LoRA 학습 스텝 (기본 1500) |

### story_compass — 방향타

| 컬럼 | 타입 | 설명 |
|------|------|------|
| project_id | VARCHAR2 PK/FK | 프로젝트 ID |
| genre | VARCHAR2 | 장르 |
| mood | VARCHAR2 | 분위기 |
| protagonist_drive | CLOB | 주인공 동기 |
| world_rules | JSON | 세계관 규칙 배열 |
| possible_directions | JSON | 가능한 방향 배열 |
| tone_keywords | JSON | 톤 키워드 배열 |
| world_backbone | CLOB | 세계관 뼈대 산문 전문 |
| version | NUMBER | 갱신 버전 (에피소드마다 증가) |
| updated_at | TIMESTAMP | 최종 갱신일 |

### assets — 유니버설 에셋

| 컬럼 | 타입 | 설명 |
|------|------|------|
| asset_id | VARCHAR2 PK | 에셋 고유 ID (예: char_kai) |
| project_id | VARCHAR2 FK | 프로젝트 ID |
| asset_type | VARCHAR2 | CHARACTER / NPC / LOCATION / ITEM / MONSTER |
| display_name | VARCHAR2 | 한글 표시명 |
| appearance_prompt | CLOB | 영어 외형 묘사 (Flux 렌더링용, 얼굴/피부/머리만) |
| outfit_prompt | VARCHAR2(1000) | 영어 의상/장비/액세서리 묘사 (CHARACTER/NPC/MONSTER) |
| outfit_anchor_id | VARCHAR2(100) | 의상 앵커 이미지 BLOB ID (IP-Adapter 참조용) |
| trigger_word | VARCHAR2 | LoRA 트리거 워드 (NULL if PROMPT) |
| lora_path | VARCHAR2 | LoRA 파일 경로 (NULL if PROMPT) |
| visual_strategy | VARCHAR2 | PROMPT / LORA |
| audio_type | VARCHAR2 | TTS / SFX / NONE |
| audio_identifier | VARCHAR2 | tts_voice_id 또는 sfx 파일명 |
| voice_hint | VARCHAR2 | 음성 특성 한글 설명 |
| appearance_count | NUMBER | 에피소드 등장 횟수 |
| pipeline_status | VARCHAR2 | 현재 파이프라인 상태 |
| created_at | TIMESTAMP | 등록일 |

### character_profiles — 캐릭터 프로필

| 컬럼 | 타입 | 설명 |
|------|------|------|
| asset_id | VARCHAR2 PK/FK | 에셋 ID |
| profile_status | VARCHAR2 | NONE / AUTO / CONFIRMED |
| personality | JSON | 성격 (core_trait, emotional_pattern, soft_spot) |
| speech_style | JSON | 말투 (sentence_length, habit_phrases, tone, speech_level) |
| backstory | JSON | 과거 (wound, desire, fear) |
| behavioral_rules | JSON | 행동 규칙 배열 |
| updated_at | TIMESTAMP | 최종 수정일 |

### asset_versions — LoRA 버전 이력

| 컬럼 | 타입 | 설명 |
|------|------|------|
| version_id | VARCHAR2 PK | 버전 고유 ID |
| asset_id | VARCHAR2 FK | 에셋 ID |
| lora_path | VARCHAR2 | LoRA 파일 경로 |
| anchor_image_path | VARCHAR2 | 앵커 이미지 경로 |
| face_distance_avg | NUMBER | 필터 통과 이미지 평균 거리 |
| training_steps | NUMBER | 학습 스텝 수 |
| is_active | NUMBER(1) | 현재 활성 여부 (0/1) |
| created_at | TIMESTAMP | 생성일 |

### voice_pool — 음성 풀

| 컬럼 | 타입 | 설명 |
|------|------|------|
| voice_id | VARCHAR2 PK | 음성 식별자 (예: voice_m_husky_01) |
| gender | VARCHAR2 | 성별 |
| age_range | VARCHAR2 | 연령대 (20-30대 등) |
| pitch | VARCHAR2 | 음역 (낮음/중음/높음) |
| tone | VARCHAR2 | 톤 (건조/따뜻/쾌활 등) |
| tags | JSON | 추가 태그 배열 |

### voice_assignments — 음성 배정 현황

| 컬럼 | 타입 | 설명 |
|------|------|------|
| project_id | VARCHAR2 FK | 프로젝트 ID |
| asset_id | VARCHAR2 FK | 에셋 ID |
| voice_id | VARCHAR2 FK | 배정된 음성 ID |
| assigned_at | TIMESTAMP | 배정일 |

### episodes — 에피소드

| 컬럼 | 타입 | 설명 |
|------|------|------|
| episode_id | VARCHAR2 PK | 에피소드 고유 ID |
| project_id | VARCHAR2 FK | 프로젝트 ID |
| episode_number | NUMBER | 회차 번호 |
| title | VARCHAR2 | 에피소드 제목 |
| user_hint | CLOB | 사용자 힌트 (NULL if 자동) |
| skeleton_json | JSON | 골격 JSON (씬 목록) |
| status | VARCHAR2 | GENERATING / REVIEW / CONFIRMED |
| overall_mood | VARCHAR2 | 전체 분위기 |
| created_at | TIMESTAMP | 생성일 |
| confirmed_at | TIMESTAMP | 확정일 |

### scenes — 씬

| 컬럼 | 타입 | 설명 |
|------|------|------|
| scene_id | VARCHAR2 PK | 씬 고유 ID |
| episode_id | VARCHAR2 FK | 에피소드 ID |
| scene_number | NUMBER | 씬 번호 |
| title | VARCHAR2 | 씬 제목 |
| location_asset_id | VARCHAR2 FK | 장소 에셋 ID |
| mood | VARCHAR2 | 분위기 |

### shots — 샷

| 컬럼 | 타입 | 설명 |
|------|------|------|
| shot_id | VARCHAR2 PK | 샷 고유 ID |
| scene_id | VARCHAR2 FK | 씬 ID |
| shot_number | NUMBER | 샷 번호 |
| render_prompt | CLOB | Wan 2.2용 영어 프롬프트 |
| camera_motion | VARCHAR2 | Static / Dolly In / Pan Left / Tilt Up |
| duration_sec | NUMBER | 목표 길이 (초) |
| transition | VARCHAR2 | cut / dissolve / fade_to_black |
| bgm_mood | VARCHAR2 | BGM 분위기 태그 |
| sfx | JSON | 효과음 목록 |
| narrative_note | CLOB | 서사적 의미 (벡터 DB 저장용) |
| snap_image_path | VARCHAR2 | 스냅 이미지 경로 |
| referenced_assets | JSON | 등장 에셋 ID 배열 |

### dialogues — 대사

| 컬럼 | 타입 | 설명 |
|------|------|------|
| dialogue_id | VARCHAR2 PK | 대사 고유 ID |
| shot_id | VARCHAR2 FK | 샷 ID |
| speaker_asset_id | VARCHAR2 FK | 화자 에셋 ID |
| text | CLOB | 대사 텍스트 |
| emotion | VARCHAR2 | 감정 태그 (cold, cheerful 등) |
| tts_voice_id | VARCHAR2 | 매핑된 음성 ID |
| tts_file_path | VARCHAR2 | TTS 생성 파일 경로 (확정 후) |
| apply_lipsync | NUMBER(1) | 립싱크 적용 여부 |

### scene_vectors — 장기 기억 (벡터)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| vector_id | VARCHAR2 PK | 고유 ID |
| project_id | VARCHAR2 FK | 프로젝트 ID |
| episode_number | NUMBER | 회차 |
| scene_text | CLOB | 장면 텍스트 |
| scene_embedding | VECTOR(768, FLOAT32) | 임베딩 벡터 |

### story_nodes / story_edges — 사건 인과 그래프 (PGQ)

**story_nodes:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| node_id | VARCHAR2 PK | 노드 ID |
| project_id | VARCHAR2 FK | 프로젝트 ID |
| episode_number | NUMBER | 발생 회차 |
| event_summary | CLOB | 사건 요약 |
| node_type | VARCHAR2 | EVENT / FORESHADOW / RESOLUTION |

**story_edges:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| edge_id | VARCHAR2 PK | 엣지 ID |
| source_node | VARCHAR2 FK | 원인 노드 |
| target_node | VARCHAR2 FK | 결과 노드 |
| relation_type | VARCHAR2 | CAUSES / FORESHADOWS / RESOLVES |

### npc_activities — NPC 행보

| 컬럼 | 타입 | 설명 |
|------|------|------|
| log_id | VARCHAR2 PK | 로그 ID |
| asset_id | VARCHAR2 FK | NPC 에셋 ID |
| project_id | VARCHAR2 FK | 프로젝트 ID |
| episode_number | NUMBER | 회차 |
| activity_summary | CLOB | 행동 요약 |
| current_location | VARCHAR2 | 현재 위치 |
| status_change | VARCHAR2 | 상태 변화 |

### pipeline_status — 파이프라인 상태 추적

| 컬럼 | 타입 | 설명 |
|------|------|------|
| entity_type | VARCHAR2 | ASSET / EPISODE |
| entity_id | VARCHAR2 | 에셋 또는 에피소드 ID |
| current_state | VARCHAR2 | 현재 상태 |
| last_success_state | VARCHAR2 | 마지막 성공 상태 |
| retry_count | NUMBER | 재시도 횟수 |
| updated_at | TIMESTAMP | 최종 갱신일 |

### pipeline_errors — 에러 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| error_id | VARCHAR2 PK | 에러 ID |
| project_id | VARCHAR2 FK | 프로젝트 ID |
| entity_id | VARCHAR2 | 에셋 또는 에피소드 ID |
| phase | VARCHAR2 | 발생 단계 |
| stage | VARCHAR2 | 세부 단계 |
| error_type | VARCHAR2 | LLM_PARSE_FAIL / GPU_OOM / FACE_CHECK_FAIL 등 |
| error_detail | CLOB | 상세 내용 |
| resolved | NUMBER(1) | 해결 여부 |
| created_at | TIMESTAMP | 발생일 |
## asset_derived_images (Derived Filter State)

| Column | Type | Description |
|------|------|------|
| image_id | VARCHAR2 PK/FK | Derived image file id |
| version_id | VARCHAR2 FK | Optional version link |
| preset_name | VARCHAR2 | Derived preset label |
| face_distance | NUMBER | Measured similarity distance after filtering |
| is_passed | NUMBER(1) NULL | `NULL` before filtering, `1` for PASS, `0` for FAIL |

## 2026-04-02 Note

- The `assets` table must expose `anchor_image_id`, `anchor_embedding`, `trigger_word`, and `lora_path`; backend startup now performs a lightweight schema sync for missing columns.
- `lora_path` and `trigger_word` are persisted when LoRA training finishes, and project detail responses rebuild `lora_result` from those columns.
