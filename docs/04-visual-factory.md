# 04. 3단계: 외형 공장

## 목적

에셋의 시각적 정체성을 고정한다. 앵커 이미지 생성 → 파생 이미지 → 얼굴 필터링까지의 전체 파이프라인.

## 핵심 원칙

- 외형 공장은 파이프라인의 한 칸이 아니라 **독립된 상시 공장**이다
- 캐릭터, NPC, 장소, 아이템, 몬스터 등 모든 에셋 타입이 진입 가능
- 처음 시작할 때 주인공을 넣을 수도 있고, 에피소드 10에서 등장한 보스를 넣을 수도 있음
- 필수가 아님. 안 하면 텍스트 묘사(PROMPT)로 폴백

## 앵커 생성

기준이 될 이미지를 만드는 단계.

### 텍스트 기반 (Flux 1 Krea Dev)

| 항목 | 내용 |
|------|------|
| 모델 | flux1-krea-dev_fp8_scaled.safetensors (UNETLoader) |
| 텍스트 인코더 | t5xxl_fp8_e4m3fn.safetensors + clip_l.safetensors (DualCLIPLoader, type=flux) |
| VAE | ae.safetensors |
| 워크플로우 | buildFluxAnchor() |
| 샘플러 | SamplerCustomAdvanced + KSamplerSelect(euler) + BasicScheduler(simple) |
| 모델 패처 | ModelSamplingFlux (max_shift=1.15, base_shift=0.5) |
| 설정 | steps=20, guidance=2.0 (FluxGuidance 노드) |
| 사이즈 | 1024×1024 (EmptyLatentImage) |
| 이미지 스타일 | **증명사진(ID photo) 형태** — 배경 없이 피사체만 중앙 배치 |

> 운영 메모: 8189 A100 서버는 ComfyUI를 `--normalvram`으로 기동한다.

에셋의 `appearance_prompt`를 입력으로 여러 장 생성. 사용자가 마음에 드는 이미지를 앵커로 선택.
`appearance_prompt`는 내부적으로 ID photo 스타일 프리픽스/서픽스로 감싸진다 (`wrapWithStyle`).

## 앵커 후처리 (Python FastAPI)

앵커 확정 후 Python API가 처리:

1. **scoreImage()**: 품질 점수 매김 (S/A/B/C 등급)
2. **getFaceBoundingBox()**: 캐릭터 한정 얼굴 좌표 추출 (이후 비교 기준)
3. 결과를 Oracle BLOB으로 저장

## 파생 이미지 생성

### 모델 및 설정

| 항목 | 내용 |
|------|------|
| 모델 | flux1-krea-dev_fp8_scaled.safetensors (UNETLoader) |
| 텍스트 인코더 | t5xxl_fp8_e4m3fn.safetensors + clip_l.safetensors (DualCLIPLoader, type=flux) |
| VAE | ae.safetensors |
| 워크플로우 | buildKontextEdit() |
| 방법 | LoadImage → ImageScaleToTotalPixels → VAEEncode → **ReferenceLatent** → BasicGuider → SamplerCustomAdvanced |
| 모델 패처 | ModelSamplingFlux (max_shift=1.15, base_shift=0.5) |
| 설정 | steps=20, guidance=2.5 (FluxGuidance 노드), BasicScheduler(simple) |
| 프롬프트 형식 | **편집 지시문** ("Change the expression to...", "Turn the face to...") |

> **주의**: 프롬프트는 외형 서술(descriptive)이 아닌 편집 명령 형식이어야 함.
> identity 보존은 ReferenceLatent 노드가 담당 (Flux 1 Krea Dev의 Kontext 기능).

### 에셋 타입별 프리셋

#### 캐릭터/NPC (15종)
- 얼굴 클로즈업 12종: 정면 미소, 정면 진지, 정면 놀람, 45도, 측면, 웃음, 화남, 슬픔, 윙크 등
- 상반신 3종: 정면, 팔짱, 손 흔들기

#### 몬스터 (8~10종)
- 정면, 측면, 후면, 공격 자세, 웅크린 자세 등
- 얼굴 필터링 대신 전체 실루엣 유사도 비교

#### 장소 (5~8종)
- 낮, 밤, 안개, 비, 다른 앵글 등
- 유사도 필터링 없이 분위기 일관성만 사용자 확인

#### 아이템 (4~6종)
- 정면, 45도, 들고 있는 모습, 빛나는 상태 등
- 형태 유사도 비교

프리셋 종류와 수는 project_config에서 에셋 타입별 조정 가능.

## 얼굴 유사도 필터링

전 프리셋 생성 후 Python API `compareFaces()` 호출:

- 앵커 대비 얼굴 거리 측정
- 거리 > face_threshold (기본 0.4) → DB에서 삭제
- `skipSimilarity: true`인 프리셋(측면 프로필 등)은 필터 제외

## 이미지 생성 속도 벤치마크 — 2026-04-06

앵커 이미지 생성 (Flux 2 Dev, 1024×1024, steps=20) 각 서버 5장 병렬 실행.

| 서버 | 안정 속도 | avg | 콜드로드 | 비고 |
|------|----------|-----|---------|------|
| 8188 RTX3090 (24GB) | ~92s | 95.39s | 108s | Windows |
| 8189 A100 (40GB) | **~41s** | **48.51s** | 90s (OOM 후 풀로드) | Linux |

> A100이 RTX3090보다 **약 2.2배 빠름** (안정 속도 기준).  
> 8189 첫 실행 시 직전 LoRA 잔여 VRAM으로 OOM 발생 후 자동 복구 → 이후 안정.

## UI 흐름

1. 에셋 목록 (타입별 필터, PROMPT 상태 표시)
2. 에셋 선택 → 앵커 생성 방식 택일 (텍스트/사진 업로드)
3. 후보 이미지 그리드 표시 (품질 등급 뱃지)
4. 앵커 선택 → 파생 이미지 생성 진행률 표시
5. 파생 결과 그리드 (거리 수치 + 통과/탈락 뱃지)
6. 필터 완료 후 갤러리 확인

## 2026-04-02 Note

- Derived images remain unclassified until the similarity filter actually runs.
- `asset_derived_images.is_passed` is treated as `NULL` before filtering, not as an implicit failure.
- If face processing cannot initialize on a host, the backend stays up and similarity checks are skipped instead of marking derived images as FAIL. If local model files are missing or placeholder files are present, the loader falls back to the bundled `@vladmandic/face-api` models.
- On Node.js 24 and later, the backend postinstall step patches `@mapbox/node-pre-gyp` used by `@tensorflow/tfjs-node` to replace deprecated legacy URL helpers with the WHATWG URL API. This prevents the `DEP0169` startup warning without disabling the native TensorFlow backend.
- CHARACTER and NPC assets require a face-visible anchor before confirmation; LOCATION, ITEM, and MONSTER assets skip the face-similarity filter and surface as `SKIP`.
