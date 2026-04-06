# Story Engine - AGENTS.md

이 문서는 `CLAUDE.md`의 프로젝트 규칙을 Codex/AGENTS 규칙으로 동일하게 반영한 파일이다. 구현 원칙과 구조 규칙은 `CLAUDE.md`와 동일하게 유지한다.

## 프로젝트 개요
Story Engine은 AI 영상 제작을 위한 오케스트레이터이다. 외부 Video Factory가 즉시 GPU 연산을 시작할 수 있도록 촬영 대본(Shot List)과 렌더링 에셋(LoRA, TTS, SFX)을 자동 매핑한다.

## 최상위 디렉토리 구조
```text
C:/Dev/Story Engine/
├── docs/          # 설계 문서 (항상 최신 유지)
├── frontend/      # React SPA (Vite) - 완성
├── backend/       # Express.js API 서버 - 완성
├── CLAUDE.md      # Claude 규칙
└── AGENTS.md      # Codex 규칙
```
프론트엔드와 백엔드는 완전히 분리된 독립 프로젝트이다. 각각 별도의 `package.json`을 가진다.

## 기술 스택
- Frontend: React 19 + Vite + Tailwind CSS v4
- Routing: React Router v7
- State: Zustand + localStorage
- Backend: Node.js + Express.js (완성, `backend/` 디렉토리)
  - 얼굴 임베딩: @vladmandic/face-api + TensorFlow.js
  - 이미지 처리: Sharp
  - 데이터베이스: Oracle 26ai (oracledb 드라이버)
  - WebSocket: ws
  - 파일 업로드: multer
- DB: Oracle 26ai

## 코딩 규칙

### 1. 디렉토리 구조 - 기능별 분리 + 깊은 계층
- 기능(feature) 단위로 디렉토리를 분리한다. 하나의 기능에 관련된 컴포넌트, 훅, 유틸, 상수는 같은 디렉토리 아래에 둔다.
- 디렉토리 깊이를 충분히 주어 파일이 한 폴더에 몰리지 않게 한다.
- 한 파일은 한 기능(컴포넌트, 훅, 유틸)에만 집중한다. 여러 역할을 한 파일에 넣지 않는다.

예시:

```text
src/
├── app/
│   ├── App.jsx
│   ├── routes.jsx
│   └── main.jsx
├── features/
│   ├── project/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── constants/
│   ├── script/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── constants/
│   ├── character/
│   ├── visual/
│   └── episode/
├── shared/
│   ├── components/
│   ├── hooks/
│   └── constants/
└── store/
```

### 2. 파일 크기 제한 - 300줄 이하
- 하나의 파일은 300줄을 절대 넘기지 않는다.
- 300줄에 근접하면 컴포넌트 분리, 훅 추출, 유틸 분리 등으로 나눈다.
- 리뷰나 리팩토링 시 300줄 초과 파일은 우선적으로 정리한다.

### 3. 파일 헤더 주석 - 시스템 맵 역할
- 모든 소스 파일(`.jsx`, `.js`, `.css`) 상단에 반드시 헤더 주석을 작성한다.
- 헤더에는 아래 정보를 포함한다.

```js
/**
 * @file 파일명
 * @description 이 파일이 하는 일 (한 줄)
 * @usage 어디서 사용되는지 (어떤 페이지, 어떤 컴포넌트가 import하는지)
 * @connects 연결되는 시스템/파일 (store, API, 다른 컴포넌트 등)
 * @doc 관련 문서 경로 (docs/XX-xxx.md)
 */
```

### 4. 문서 동기화 - docs/ 자동 갱신
- `docs/` 폴더의 설계 문서를 항상 참고하며 개발한다.
- 구현 중 설계 문서와 달라지는 부분이 생기면 해당 문서를 즉시 업데이트한다.
- 새로운 기능을 추가할 때 관련 `docs` 문서가 있으면 반드시 읽고, 변경 사항이 있으면 문서에 반영한다.
- 문서 변경 시 변경 이유를 주석이나 커밋 메시지에 남긴다.

## 디자인 토큰
- 배경: `slate-900` (메인) / `slate-800` (카드/서피스)
- 테두리: `slate-700`
- 액센트: `teal-500` (`#14b8a6`)
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
```text
/                                              -> 프로젝트 목록
/project/:id/seed                              -> 1a. 씨앗 입력
/project/:id/prompt-a                          -> 1b. 프롬프트 A
/project/:id/paste-a                           -> 1c. 응답 붙여넣기
/project/:id/prompt-b                          -> 1d. 프롬프트 B
/project/:id/assets                            -> 1e. 에셋 확정
/project/:id/characters                        -> 2a. 캐릭터 목록
/project/:id/characters/:assetId/prompt        -> 2b. 캐릭터 프롬프트
/project/:id/characters/:assetId/confirm       -> 2c. 캐릭터 확정
/project/:id/visual                            -> 3a. 에셋 선택
/project/:id/visual/:assetId/anchor            -> 3b. 앵커 이미지 선택
/project/:id/visual/:assetId/derived           -> 3c. 파생 이미지 생성
/project/:id/visual/:assetId/complete          -> 3d. LoRA 학습 상태
/project/:id/episode                           -> 4a. 에피소드 시작
/project/:id/episode/:episodeId/skeleton       -> 4b. 골격 생성
/project/:id/episode/:episodeId/storyboard     -> 4c. 스토리보드 리뷰
/project/:id/episode/:episodeId/confirm        -> 4d. 에피소드 확정
```
