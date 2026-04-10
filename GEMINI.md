# Story Engine — GEMINI.md

## 프로젝트 개요
Story Engine은 AI 영상 제작을 위한 오케스트레이터입니다. 직접 영상을 렌더링하지 않고, 외부 Video Factory가 GPU 연산을 시작할 수 있도록 촬영 대본(Shot List)과 렌더링 에셋(TTS, SFX)을 자동 매핑합니다.

## 핵심 목표 (Gemini CLI 역할)
1. **기술 스택 준수**: React 19, Vite, Tailwind v4(프론트) 및 Node.js, Express, Oracle 26ai(백엔드) 환경에서 최적의 코드를 작성합니다.
2. **코딩 규칙 엄수**: 파일당 300줄 제한, 모든 파일 상단 헤더 주석 필수, 기능별 디렉토리 분리 규칙을 철저히 지킵니다.
3. **문서 동기화**: `docs/` 내의 설계 문서와 구현을 항상 일치시키며, 변경 시 문서를 즉시 업데이트합니다.
4. **4단계 워크플로우 지원**: 대본 입력(1단계), 캐릭터 설정(2단계), 외형 공장(3단계), 에피소드 생성(4단계)의 흐름을 이해하고 각 단계의 기능을 구현/유지보수합니다.

## 기술 스택 요약
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router v7, Zustand
- **Backend**: Node.js, Express.js, `@vladmandic/face-api`, Sharp, oracledb, ws, multer
- **Database**: Oracle 26ai (JSON Duality, Vector Search, Property Graph)
- **AI/GPU**: ComfyUI (Flux Dev, PuLID, Kontext)

## 코딩 가이드라인
### 1. 파일 헤더 주석 (필수)
모든 소스 파일 상단에 다음 형식을 반드시 포함합니다:
```javascript
/**
 * @file 파일명
 * @description 파일의 핵심 역할 (한 줄)
 * @usage 사용처 및 호출 경로
 * @connects 연결된 시스템 (store, API 등)
 * @doc 관련 설계 문서 경로 (docs/XX-xxx.md)
 */
```

### 2. 파일 크기 및 분리
- 하나의 파일은 **300줄**을 초과할 수 없습니다.
- 기능(feature) 단위로 디렉토리를 깊게 구성하여 파일이 분산되도록 합니다.
- 로직은 커스텀 훅(`hooks/`)이나 유틸리티(`utils/`)로 분리하여 컴포넌트를 가볍게 유지합니다.

### 3. 데이터베이스 및 SQL
- Oracle 26ai의 기능을 최대한 활용하며, SQL과 로직을 분리하여 관리합니다.
- 데이터베이스 설계 변경 시 `docs/06-database.md`를 먼저 업데이트합니다.

## 디자인 시스템 (Tailwind v4)
- **배경**: slate-900 / slate-800
- **액센트**: teal-500 (#14b8a6)
- **폰트**: Space Grotesk (헤더), Inter (본문), Monospace (프롬프트)
- **특수 기호**: UI 흐름 표시 시 `→`, `✓`, `•`, `──` 등을 적극 활용합니다.

## 업무 수행 원칙
- **문서 우선**: 구현 전 `docs/`와 `CLAUDE.md`를 먼저 분석합니다.
- **자가 검증**: 모든 변경 사항은 `dev.js`를 통해 백엔드/프론트엔드 구동 여부를 확인하고, 테스트 코드를 포함합니다.
- **한국어 응답**: 모든 응답과 설명은 한국어로 작성합니다.
