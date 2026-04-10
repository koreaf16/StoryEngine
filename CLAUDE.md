# Story Engine — CLAUDE.md

## 프로젝트 개요
Story Engine은 AI 영상 제작을 위한 오케스트레이터이다. 외부 Video Factory가 즉시 GPU 연산을 시작할 수 있도록 촬영 대본(Shot List)과 렌더링 에셋(LoRA, TTS, SFX)을 자동 매핑한다.

## 최상위 디렉토리 구조
```
C:/Dev/Story Engine/
├── docs/          # 설계 문서 (항상 최신 유지)
├── frontend/      # React SPA (Vite) - 완성
├── backend/       # Express.js API 서버 - 완성
├── CLAUDE.md      # 이 파일
└── AGENTS.md      # Codex용 동일 규칙
```
프론트엔드와 백엔드는 완전히 분리된 독립 프로젝트이다. 각각 별도의 package.json을 가진다.

## 기술 스택
- Frontend: React 19 + Vite + Tailwind CSS v4
- Routing: React Router v7
- State: Zustand + localStorage
- Backend: Node.js + Express.js (완성, /backend)
  - 얼굴 임베딩: @vladmandic/face-api + TensorFlow.js
  - 이미지 처리: Sharp
  - 데이터베이스: Oracle 26ai (oracledb 드라이버)
  - WebSocket: ws
  - 파일 업로드: multer
- DB: Oracle 26ai

---

## 코딩 규칙

### 1. 디렉토리 구조 — 기능별 분리 + 깊은 계층
- **기능(feature) 단위로 디렉토리를 분리**한다. 하나의 기능에 관련된 컴포넌트, 훅, 유틸, 상수는 같은 디렉토리 아래에 둔다.
- 디렉토리 깊이를 충분히 주어 파일이 한 폴더에 몰리지 않게 한다.
- **한 파일 = 한 기능(컴포넌트, 훅, 유틸)**. 여러 역할을 한 파일에 넣지 않는다.
- 예시:
  ```
  src/
  ├── app/
  │   ├── App.jsx                  # 라우터 + 레이아웃 조합
  │   ├── routes.jsx               # 라우트 정의만
  │   └── main.jsx                 # 엔트리포인트
  ├── features/
  │   ├── project/                 # 프로젝트 관리 기능
  │   │   ├── components/
  │   │   │   ├── ProjectCard.jsx
  │   │   │   ├── ProjectCardStats.jsx
  │   │   │   ├── ProjectStatusBadge.jsx
  │   │   │   ├── NewProjectCard.jsx
  │   │   │   └── NewProjectModal.jsx
  │   │   ├── hooks/
  │   │   │   └── useProjects.js
  │   │   ├── pages/
  │   │   │   └── ProjectListPage.jsx
  │   │   └── constants/
  │   │       └── projectStatus.js
  │   ├── script/                  # 1단계: 대본 입력
  │   │   ├── components/
  │   │   │   ├── SeedTextarea.jsx
  │   │   │   ├── PromptDisplay.jsx
  │   │   │   ├── ResponsePasteZone.jsx
  │   │   │   ├── ResponsePreview.jsx
  │   │   │   ├── AssetRow.jsx
  │   │   │   ├── AssetEditModal.jsx
  │   │   │   └── AssetAddForm.jsx
  │   │   ├── hooks/
  │   │   │   ├── useSeed.js
  │   │   │   ├── usePromptBuilder.js
  │   │   │   └── useAssets.js
  │   │   ├── pages/
  │   │   │   ├── SeedInputPage.jsx
  │   │   │   ├── PromptAPage.jsx
  │   │   │   ├── PasteResponsePage.jsx
  │   │   │   ├── PromptBPage.jsx
  │   │   │   └── AssetConfirmPage.jsx
  │   │   ├── utils/
  │   │   │   ├── buildPromptA.js
  │   │   │   ├── buildPromptB.js
  │   │   │   └── parseAssetJson.js
  │   │   └── constants/
  │   │       ├── promptTemplates.js
  │   │       └── assetTypes.js
  │   ├── character/               # 2단계 (향후)
  │   ├── visual/                  # 3단계 (향후)
  │   └── episode/                 # 4단계 (향후)
  ├── shared/
  │   ├── components/
  │   │   ├── layout/
  │   │   │   ├── Layout.jsx
  │   │   │   ├── Header.jsx
  │   │   │   └── ProgressBar.jsx
  │   │   ├── ui/
  │   │   │   ├── Badge.jsx
  │   │   │   ├── Button.jsx
  │   │   │   ├── Card.jsx
  │   │   │   ├── Modal.jsx
  │   │   │   ├── Textarea.jsx
  │   │   │   └── CopyButton.jsx
  │   │   └── patterns/
  │   │       └── PromptCopyPaste.jsx
  │   ├── hooks/
  │   │   ├── useClipboard.js
  │   │   └── useLocalStorage.js
  │   └── constants/
  │       ├── colors.js
  │       └── badgeConfig.js
  └── store/
      ├── useProjectStore.js
      └── useUIStore.js
  ```

### 2. 파일 크기 제한 — 300줄 이하
- **하나의 파일은 300줄을 절대 넘지 않는다.**
- 300줄에 근접하면 컴포넌트 분리, 훅 추출, 유틸 분리 등으로 나눈다.
- 린트나 리뷰 시 300줄 초과 파일은 즉시 리팩토링한다.

### 3. 파일 헤더 주석 — 시스템 맵 역할
- **모든 소스 파일(.jsx, .js, .css) 상단에 반드시 헤더 주석을 작성**한다.
- 헤더에 포함할 내용:
  ```
  /**
   * @file 파일명
   * @description 이 파일이 하는 일 (한 줄)
   * @usage 어디서 사용되는지 (어떤 페이지, 어떤 컴포넌트가 import하는지)
   * @connects 연결되는 시스템/파일 (store, API, 다른 컴포넌트 등)
   * @doc 관련 문서 경로 (docs/XX-xxx.md)
   */
  ```
- 이 헤더만 보고도 이 파일의 역할과 시스템 내 위치를 파악할 수 있어야 한다.

### 4. 문서 동기화 — docs/ 자동 갱신
- `docs/` 폴더의 설계 문서를 항상 참고하며 개발한다.
- **구현 중 설계 문서와 달라지는 부분이 생기면, 해당 문서를 즉시 업데이트**한다.
- 새로운 기능을 추가할 때 관련 docs 문서가 있으면 반드시 읽고, 변경 사항이 있으면 문서에 반영한다.
- 문서 변경 시 변경 이유를 주석이나 커밋 메시지에 남긴다.

### 5. AI 모델 관련 사항 — 인터넷 검색 최우선
- **Flux, WAN2.1/2.2, LoRA 학습, PuLID, ControlNet 등 AI 모델과 관련된 모든 사항은 반드시 인터넷 검색을 먼저 수행한 뒤 답변하거나 코드를 작성한다.**
- 훈련 내용(학습 파라미터), 추론 내용(워크플로우 파라미터) 모두 해당된다. 파라미터 예시: guidance, steps, sampler, scheduler, denoise, weight, learning_rate, rank, batch_size, resolution 등.
- **절대 추측하거나 기억에 의존하지 않는다.** 모델별·GPU별·용도별로 최적값이 다르고 커뮤니티 권장값이 빠르게 바뀌므로, 항상 최신 정보를 검색한다.
- 검색 대상 우선순위: 모델 제작자 공식 문서 → ComfyUI 공식 문서 → civitai → Reddit r/StableDiffusion → GitHub 이슈/디스커션.
- 적용 시 해당 파라미터 옆에 출처 URL을 주석으로 반드시 남긴다.
- 예시:
  ```javascript
  // Kontext Dev 커뮤니티 권장: guidance 2.5-4.0, euler+simple, 28 steps
  // https://docs.comfy.org/tutorials/flux/flux-1-kontext-dev
  guidance: 3.5,
  steps: 28,
  ```

---

## 디자인 토큰
- 배경: slate-900 (메인) / slate-800 (카드/서피스)
- 테두리: slate-700
- 액센트: teal-500 (#14b8a6)
- 뱃지 색상:
  - 캐릭터: teal
  - NPC: purple
  - 장소: blue
  - 아이템: orange (coral)
  - 몬스터: gray
  - PROMPT 전략: gray
  - LORA 전략: teal
- 헤드라인 폰트: Space Grotesk
- 본문 폰트: Inter
- 프롬프트 텍스트: monospace

## 라우팅
```
/                                              → 프로젝트 목록
/project/:id/seed                              → 1a. 씨앗 입력
/project/:id/prompt-a                          → 1b. 프롬프트 A
/project/:id/paste-a                           → 1c. 응답 붙여넣기
/project/:id/prompt-b                          → 1d. 프롬프트 B
/project/:id/assets                            → 1e. 에셋 확정
/project/:id/characters                        → 2a. 캐릭터 목록
/project/:id/characters/:assetId/prompt        → 2b. 캐릭터 프롬프트
/project/:id/characters/:assetId/confirm       → 2c. 캐릭터 확정
/project/:id/visual                            → 3a. 에셋 선택
/project/:id/visual/:assetId/anchor            → 3b. 앵커 이미지 선택
/project/:id/visual/:assetId/derived           → 3c. 파생 이미지 생성
/project/:id/visual/:assetId/complete          → 3d. LoRA 학습 상태
/project/:id/episode                           → 4a. 에피소드 시작
/project/:id/episode/:episodeId/skeleton       → 4b. 골격 생성
/project/:id/episode/:episodeId/storyboard     → 4c. 스토리보드 리뷰
/project/:id/episode/:episodeId/confirm        → 4d. 에피소드 확정
```
