# Story Engine — 전체 개요

## 시스템 정의

Story Engine은 직접 영상을 렌더링하지 않는다. 외부 Video Factory(Wan 2.2, 립싱크 노드 등)가 즉시 GPU 연산을 시작할 수 있도록 **완벽한 촬영 대본(Shot List)**과 **렌더링 에셋(LoRA, TTS, SFX)**을 자동 매핑해주는 오케스트레이터이다.

## 핵심 설계 원칙

### 수동-자동 브릿지

초기에는 사용자가 시스템이 조립한 프롬프트를 복사하여 외부 LLM(Claude 등)에 붙여넣고, 결과를 다시 시스템에 입력한다. 프롬프트가 최적화되면 내부 API 연동을 통해 100% 자동화로 전환한다.

### 유니버설 렌더링 폴백

모든 에셋은 기본적으로 텍스트(PROMPT)로 등록된다. 시각적 일관성이 필요한 시점에 사용자가 직접 LoRA로 승격(On-Demand)한다. LoRA가 없어도 텍스트 묘사로 렌더링이 작동한다.

### 점진적 세계 성장

마스터 대본을 미리 완성하지 않는다. 씨앗(세계관 뼈대 + 방향타)만 잡아놓고, 에피소드를 하나씩 만들면서 이야기가 유기적으로 자란다. 새로운 캐릭터, 장소, 아이템은 에피소드 생성 중 즉석 등록된다.

## 4단계 직선 흐름

```
0. 프로젝트 선택/생성
1. 대본 입력 → 씨앗 + 방향타 + 에셋 등록 + 음성 배정
2. 캐릭터 잡기 → 주요 캐릭터 성격/말투/과거사
3. 외형 공장 → 아무 에셋, 아무 시점에 LoRA 승격
4. 에피소드 만들기 → 샷 + 스냅 이미지 + 스토리보드 리뷰
   → 확정 → TTS 일괄 → Export JSON → 세계 갱신 → 반복
```

- 1→2는 순서대로 진행
- 2 이후부터는 3과 4를 자유롭게 오감
- 4를 반복하다가 언제든 3에 에셋을 넣고 다시 4로 돌아올 수 있음

## 기술 스택

| 구성 | 기술 | 역할 |
|------|------|------|
| Frontend | React 19 + Vite | UI, 라우팅, 상태 관리 |
| Backend | Node.js (Express.js) | 전체 제어, 프롬프트 조립(Handlebars), JSON 파싱, 오토 바인딩 |
| AI Vision | face-api.js + TensorFlow.js | 얼굴 임베딩, 감지, 필터링 |
| 이미지 처리 | Sharp | 이미지 리사이징, 필터링 |
| Database | Oracle 26ai | JSON Duality(메타데이터), Vector Search(장기 기억), Property Graph(인과관계) |
| Cache/Queue | Redis + BullMQ | GPU 작업 큐, 컨텍스트 캐싱 |
| GPU Worker | ComfyUI | Flux Dev(이미지 생성), PuLID(참조 얼굴), Kontext(파생 이미지), LoRA 학습 |
| 영상 생성 | Wan 2.2 (외부) | I2V 영상 렌더링, 립싱크 (Story Engine 범위 밖, 추후 연동) |

## 인프라 레이어

### Orchestration Layer (제어 중추)

- **BullMQ**: GPU 작업 큐 (gpu:realtime / gpu:batch / gpu:training)
- **State Machine**: 에셋/에피소드별 파이프라인 상태 추적
- **Error Handler**: LLM 응답 검증, ComfyUI 타임아웃, 자동 재시도
- **Config Store**: 프로젝트별 설정값 (face_threshold, rag_top_k 등)

### Data Layer

- **JSON Duality**: 에셋, 버전, 프로필, 프로젝트 설정
- **Vector Store**: 과거 장면 임베딩 (장기 기억)
- **Property Graph**: 사건 인과관계, NPC 행보 추적
- **Redis**: BullMQ 큐 백엔드, 컨텍스트 캐시

## 관련 문서

- [01-project.md](01-project.md) — 프로젝트 관리
- [02-script-input.md](02-script-input.md) — 1단계: 대본 입력
- [03-character-setup.md](03-character-setup.md) — 2단계: 캐릭터 잡기
- [04-visual-factory.md](04-visual-factory.md) — 3단계: 외형 공장
- [05-episode.md](05-episode.md) — 4단계: 에피소드 만들기
- [06-database.md](06-database.md) — 데이터베이스 스키마
- [07-asset-lifecycle.md](07-asset-lifecycle.md) — 에셋 생명주기 및 오토 바인딩
- [08-audio-system.md](08-audio-system.md) — 오디오 시스템 (TTS, SFX, 립싱크)
- [09-export-json.md](09-export-json.md) — Export JSON 계약
- [10-ui-spec.md](10-ui-spec.md) — UI 명세
