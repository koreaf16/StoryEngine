# 04. 3단계: 외형 공장

## 목적

에셋의 시각적 정체성을 고정한다. 앵커 이미지 생성 → 파생 이미지 → 얼굴 필터링 → LoRA 학습까지의 전체 파이프라인.

## 핵심 원칙

- 외형 공장은 파이프라인의 한 칸이 아니라 **독립된 상시 공장**이다
- 캐릭터, NPC, 장소, 아이템, 몬스터 등 모든 에셋 타입이 진입 가능
- 처음 시작할 때 주인공을 넣을 수도 있고, 에피소드 10에서 등장한 보스를 넣을 수도 있음
- 필수가 아님. 안 하면 텍스트 묘사(PROMPT)로 폴백

## 앵커 생성

기준이 될 이미지를 만드는 단계. 두 가지 경로 택일.

### 경로 A: 텍스트 기반 (Flux 2 Dev)

| 항목 | 내용 |
|------|------|
| 모델 | flux2_dev_fp8mixed.safetensors (UNETLoader) |
| 텍스트 인코더 | mistral_3_small_flux2_fp8.safetensors (CLIPLoader, type=flux2) |
| VAE | flux2-vae.safetensors |
| 워크플로우 | buildFluxAnchor() |
| 샘플러 | SamplerCustomAdvanced + KSamplerSelect(euler) + Flux2Scheduler |
| 설정 | steps=20, guidance=4.0 (FluxGuidance 노드) |
| 사이즈 | 1024×1024 (EmptyFlux2LatentImage, 128채널 latent) |
| 이미지 스타일 | **증명사진(ID photo) 형태** — 배경 없이 피사체만 중앙 배치 |

에셋의 `appearance_prompt`를 입력으로 여러 장 생성. 사용자가 마음에 드는 이미지를 앵커로 선택.
`appearance_prompt`는 내부적으로 ID photo 스타일 프리픽스/서픽스로 감싸진다 (`wrapWithStyle`).

### 경로 B: 참조 사진 기반 (PuLID Flux 2)

| 항목 | 내용 |
|------|------|
| 모델 | Flux 2 Dev + pulid_flux2_dev.safetensors |
| 확장 노드 | ComfyUI-PuLID-Flux2 (iFayens) |
| 워크플로우 | buildPulidAnchor() |
| 방법 | ApplyPuLIDFlux2로 레퍼런스 얼굴 identity 주입 (strength=1.4) |

사용자가 외부 사진을 업로드하면 PuLID가 그 얼굴의 identity를 Flux 2에 주입하여 세계관에 맞는 이미지를 생성.

## 앵커 후처리 (Python FastAPI)

앵커 확정 후 Python API가 처리:

1. **scoreImage()**: 품질 점수 매김 (S/A/B/C 등급)
2. **getFaceBoundingBox()**: 캐릭터 한정 얼굴 좌표 추출 (이후 비교 기준)
3. 결과를 Oracle BLOB으로 저장

## 파생 이미지 생성

### 모델 및 설정

| 항목 | 내용 |
|------|------|
| 모델 | flux2_dev_fp8mixed.safetensors (UNETLoader) |
| 텍스트 인코더 | mistral_3_small_flux2_fp8.safetensors (CLIPLoader, type=flux2) |
| VAE | flux2-vae.safetensors |
| 워크플로우 | buildKontextEdit() |
| 방법 | LoadImage → ImageScaleToTotalPixels → VAEEncode → **ReferenceLatent** → BasicGuider → SamplerCustomAdvanced |
| 설정 | steps=20, guidance=4.0 (FluxGuidance 노드), Flux2Scheduler |
| 프롬프트 형식 | **편집 지시문** ("Change the expression to...", "Turn the face to...") |

> **주의**: 프롬프트는 외형 서술(descriptive)이 아닌 편집 명령 형식이어야 함.
> identity 보존은 ReferenceLatent 노드가 담당. Flux 2 Dev의 멀티레퍼런스 기능으로 기존 Kontext Dev 대비 얼굴/피부 질감 개선.

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

## LoRA 학습

필터 통과한 이미지들로 ComfyUI-FluxTrainer를 통해 LoRA 학습을 실행한다.

### 외부 시스템 연동

| 항목 | 내용 |
|------|------|
| 학습 시스템 | ComfyUI-FluxTrainer 커스텀 노드 (kijai) |
| 베이스 모델 | FLUX1\flux1-dev-fp8.safetensors |
| CLIP-L | clip_l.safetensors |
| T5 | t5xxl_fp8_e4m3fn.safetensors |
| VAE | ae.safetensors (Flux1 전용) |
| 노드 체인 | FluxTrainModelSelect → TrainDatasetGeneralConfig + TrainDatasetAdd → OptimizerConfig → InitFluxLoRATraining → FluxTrainLoop → **FluxTrainEnd** (output_node: true) |
| 진행률 추적 | ComfyUI WebSocket `progress` 이벤트 → ProgressTracker → task.progress |

> **주의**: `FluxTrainSave`는 `output_node: false`라 단독으로 큐 제출 시 `prompt_no_outputs` 에러 발생.  
> 반드시 `FluxTrainEnd`를 마지막 노드로 사용할 것.

### 데이터셋 경로 주의사항

- 이미지를 ComfyUI `input/{subfolder}/` 에 업로드 (`uploadImage(buffer, filename, subfolder)`)
- `TrainDatasetAdd`의 `dataset_path`는 **Python 프로세스 CWD 기준 상대경로** 또는 절대경로
- ComfyUI가 `D:\ComfyUI\` 에서 실행되므로 → `dataset_path = D:\ComfyUI\ComfyUI\input\lora_{assetId}`
- config.js `COMFYUI_INPUT_DIR` (env: `COMFYUI_INPUT_DIR`) 로 관리

### 학습 하이퍼파라미터 (환경변수 조정 가능)

| 파라미터 | 현재 기본값 | 환경변수 | 비고 |
|----------|------------|----------|------|
| steps | 1500 | LORA_TRAINING_STEPS | |
| network_dim (rank) | 32 | LORA_RANK | 이미지 수에 따라 조정 |
| network_alpha | 16 | LORA_ALPHA | 보통 rank의 절반 |
| learning_rate | 0.0004 | LORA_LEARNING_RATE | |
| optimizer | adamw8bit | LORA_OPTIMIZER | |
| gradient_checkpointing | enabled | LORA_GRADIENT_CHECKPOINTING | false → disabled |
| blocks_to_swap | 0 | - | VRAM 24GB 기준 0이 최적 |
| batch_size | 1 | - | 24GB 기준 1이 최적 (아래 벤치마크 참고) |
| resolution | 512 | - | |
| num_repeats | ceil(steps / imageCount) | - | 자동 계산 |
| cache_latents | memory | - | |
| cache_text_encoder_outputs | memory | - | |

#### 이미지 수별 권장 rank

| 이미지 수 | network_dim | network_alpha | steps |
|----------|-------------|---------------|-------|
| ~15장 | 32 | 16 | 1500 |
| ~30장 | 64 | 32 | 2000~3000 |
| 50장+ | 128 | 64 | 3000+ |

### 실행 흐름

1. 이미지를 ComfyUI `input/lora_{assetId}/` 서브폴더에 업로드
2. `buildFluxLoraTraining()`으로 워크플로우 빌드 (dataset_path = 절대경로)
3. `comfyui.queuePrompt()`로 학습 큐 제출
4. WebSocket 트래커로 진행률을 1초 간격 갱신 (프론트엔드 2초 폴링)
5. `_pollWithCancel()`로 완료 대기 (타임아웃: max(steps × 3s, 1시간))
6. `FluxTrainEnd` history output의 `lora_path` STRING에서 파일명 추출 → ComfyUI output 폴더에서 다운로드
7. Oracle BLOB 저장 (`storage.saveLora`) → `lora_id` 발급
8. DB 갱신: `lora_path = lora_id`, `trigger_word`, `visual_strategy = 'LORA'`, `pipeline_status = 'LORA_TRAINED'`

### 이미지 생성 속도 벤치마크 — 2026-04-06

앵커 이미지 생성 (Flux 2 Dev, 1024×1024, steps=20) 각 서버 5장 병렬 실행.

| 서버 | 안정 속도 | avg | 콜드로드 | 비고 |
|------|----------|-----|---------|------|
| 8188 RTX3090 (24GB) | ~92s | 95.39s | 108s | Windows |
| 8189 A100 (40GB) | **~41s** | **48.51s** | 90s (OOM 후 풀로드) | Linux |

> A100이 RTX3090보다 **약 2.2배 빠름** (안정 속도 기준).  
> 8189 첫 실행 시 직전 LoRA 잔여 VRAM으로 OOM 발생 후 자동 복구 → 이후 안정.

---

### RTX 3090 (24GB) LoRA 학습 벤치마크 — 2026-04-06

아래 설정은 모두 **rank 32 / alpha 16 / 15장 / 1500 steps / gradient_checkpointing: enabled** 기준.

| blocks_to_swap | batch_size | s/it | 총 예상 시간 | 비고 |
|---------------|------------|------|------------|------|
| 20 | 1 | 2.46s | ~61분 | CPU 스왑 오버헤드 있음 |
| 0 | 2 | 3.96s | ~99분 | batch=2가 오히려 느림 |
| **0** | **1** | **2.17s** | **~54분** | **현재 권장 설정 ★** |

> **결론**: VRAM 11GB/24GB 사용(blocks_to_swap: 0 시) → swap 불필요. batch_size: 2는 step당 연산이 2배라 총 시간 증가. **batch_size: 1 + blocks_to_swap: 0 이 최적 (2.17s/it, ~54분).**

### A100 (8189, Linux) 벤치마크 — 2026-04-06

아래 설정은 **rank 32 / alpha 16 / 8장 / gradient_checkpointing: enabled** 기준.

| blocks_to_swap | batch_size | cache | rank | fp8_base | steps | s/it | 총 예상 시간 | 비고 |
|---------------|------------|-------|------|----------|-------|------|------------|------|
| 8 | 1 | disk | 32 | true | 1500 | 1.19s | ~30분 | 초기 설정 |
| **0** | **1** | **memory** | **64** | **false (bf16)** | **1500** | **1.01s** | **~25분** | **현재 권장 설정 ★** |

> **VRAM 현황 (2026-04-06)**: 사용 ~23GB / 전체 40GB (bf16 모델 +8GB).  
> `gradient_checkpointing: disabled` 시 OOM 발생 (클린 기동 재시도에서도 동일) → **enabled 고정 필수**.  
> `unet dtype: torch.bfloat16` 확인 — fp8 대비 gradient 정밀도 향상.  
> 15장 기준 steps는 2000~3000 권장 (품질 개선).

### 완료 결과

- `lora_path`에 Oracle BLOB ID 기록 (예: `lora_a1b2c3d4...`)
- `trigger_word` 설정 (예: `kai_char`)
- `visual_strategy`를 `PROMPT` → `LORA`로 승격
- `pipeline_status`를 `LORA_TRAINED`로 갱신

## LoRA 버전 관리

학습할 때마다 asset_versions 테이블에 새 버전이 생긴다.

| 필드 | 설명 |
|------|------|
| version_id | 버전 고유 ID |
| asset_id | 에셋 ID |
| lora_path | LoRA 파일 경로 |
| anchor_image_path | 앵커 이미지 경로 |
| face_distance_avg | 필터 통과 이미지의 평균 얼굴 거리 |
| training_steps | 학습 스텝 수 |
| created_at | 생성 시각 |
| is_active | 현재 활성 여전 여부 |

- 활성 버전 하나만 is_active=true
- 이전 버전은 보존. 롤백은 is_active 플래그만 변경
- 디스크 용량 관리: N개 초과 시 가장 오래된 비활성 버전 정리 정책

## GPU 큐 처리

외형 공장의 모든 GPU 작업은 BullMQ를 통해 순차 처리:

- 앵커 생성: `gpu:batch` 큐
- 파생 이미지 생성: `gpu:batch` 큐
- LoRA 학습: `gpu:training` 큐 (최저 우선순위, 독점 모드)

에피소드 작업(Phase 4)과 동시에 진행 가능. LoRA 학습 중에는 다른 GPU 작업 대기.

## 에셋 승격 제안

시스템이 에셋 등장 횟수를 추적하여 승격을 제안한다:

- 3회 이상 등장한 에셋이 아직 PROMPT 상태이면
- "이 에셋을 LoRA로 고정하시겠습니까?" 알림 표시
- 결정은 사용자 몫

## UI 흐름

1. 에셋 목록 (타입별 필터, PROMPT/LORA 상태 표시)
2. 에셋 선택 → 앵커 생성 방식 택일 (텍스트/사진 업로드)
3. 후보 이미지 그리드 표시 (품질 등급 뱃지)
4. 앵커 선택 → 파생 이미지 생성 진행률 표시
5. 파생 결과 그리드 (거리 수치 + 통과/탈락 뱃지)
6. LoRA 학습 → 완료 화면 (트리거 워드, 파일 경로 표시)
## 2026-04-02 Note

- Derived images remain unclassified until the similarity filter actually runs.
- `asset_derived_images.is_passed` is treated as `NULL` before filtering, not as an implicit failure.
- If face processing cannot initialize on a host, the backend stays up and similarity checks are skipped instead of marking derived images as FAIL. If local model files are missing or placeholder files are present, the loader falls back to the bundled `@vladmandic/face-api` models.
- On Node.js 24 and later, the backend postinstall step patches `@mapbox/node-pre-gyp` used by `@tensorflow/tfjs-node` to replace deprecated legacy URL helpers with the WHATWG URL API. This prevents the `DEP0169` startup warning without disabling the native TensorFlow backend.
- CHARACTER and NPC assets require a face-visible anchor before confirmation; LOCATION, ITEM, and MONSTER assets skip the face-similarity filter and surface as `SKIP`.
- LoRA training now moves through `LORA_TRAINING` first, and the UI polls `/api/visual/lora/status/:taskId` until the persisted `trigger_word` and `lora_path` are available.
