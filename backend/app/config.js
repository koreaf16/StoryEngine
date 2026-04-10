/**
 * @file config.js
 * @description 앱 전체 설정 관리. ComfyUI URL, Oracle DB 접속 정보, 모델명 등.
 * @usage 프로젝트 전체에서 설정값 참조 시 사용.
 * @connects .env, .env.local
 * @doc docs/06-database.md
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

// ComfyUI
const COMFYUI_BASE_URL = process.env.COMFYUI_URL || 'http://192.168.0.3:8189';

// 서버별 input 폴더 기본값 (URL로 자동 분기)
// 8188: Windows RTX3090  →  D:\ComfyUI\ComfyUI\input
// 8189: Linux A100       →  /home/vllm/comfy/input
const _DEFAULT_INPUT_DIRS = {
  'http://192.168.0.3:8188': 'D:\\ComfyUI\\ComfyUI\\input',
  'http://192.168.0.3:8189': '/home/vllm/comfy/input',
};
const COMFYUI_INPUT_DIR = process.env.COMFYUI_INPUT_DIR
  || _DEFAULT_INPUT_DIRS[COMFYUI_BASE_URL]
  || '/home/vllm/comfy/input';

// 얼굴 필터 임계값: 거리 > 이 값이면 탈락
const FACE_THRESHOLD = parseFloat(process.env.FACE_THRESHOLD || '0.4');

// 앵커 후보 기본 생성 수
const DEFAULT_CANDIDATE_COUNT = parseInt(process.env.CANDIDATE_COUNT || '8', 10);

// 이미지 해상도
const ANCHOR_WIDTH = 1024;
const ANCHOR_HEIGHT = 1024;

// Oracle Database (23ai)
const ORACLE_USER = process.env.ORACLE_USER || 'video';
const ORACLE_PASSWORD = process.env.ORACLE_PASSWORD || 'Gnttkak1!';
const ORACLE_DSN = process.env.ORACLE_DSN || '192.168.0.120:1521/AI_DB';
const ORACLE_INSTANT_CLIENT_PATH = process.env.ORACLE_INSTANT_CLIENT_PATH || 'C:\\instantclient_23_0';

// Flux 1 Krea Dev 모델명 (ComfyUI에 등록된 파일명 그대로)
const FLUX_MODEL = process.env.FLUX_MODEL || 'flux1-krea-dev_fp8_scaled.safetensors';

// Flux Kontext Dev — 파생 이미지 전용 (기준 이미지 + 편집 지시 네이티브 지원)
const FLUX_KONTEXT_MODEL = process.env.FLUX_KONTEXT_MODEL || 'flux1-dev-kontext_fp8_scaled.safetensors';
const FLUX_CLIP_L = 'clip_l.safetensors';
const FLUX_T5 = 't5xxl_fp8_e4m3fn.safetensors';
const FLUX_VAE = 'ae.safetensors';

// Skin LoRA 설정 (Krea 모델 조합용)
const SKIN_LORA_MODEL = 'Photorealistic_Skin_LoRA.safetensors';
const SKIN_LORA_WEIGHT = 0.65;
const SKIN_LORA_TRIGGER = 'aidmarealisticskin';

// 한국인 미형 LoRA (예: Korean_Aesthetic_Flux)
const K_AESTHETIC_LORA = 'korean_aesthetic_v1.safetensors';
const K_AESTHETIC_WEIGHT = 0.6;
const K_AESTHETIC_TRIGGER = 'korean aesthetic, k-girl, k-boy';

// 실사 강화 LoRA (예: Realism_Fortifier)
const REALISM_LORA = 'realism_fortifier_v1.safetensors';
const REALISM_WEIGHT = 0.4;
const REALISM_TRIGGER = 'cinematic photo, high fidelity';

// PuLID Flux 1 모델 (ComfyUI-PuLID-Flux 확장 필요)
const PULID_MODEL = process.env.PULID_MODEL || 'pulid_flux_v0.9.1.safetensors';
const PULID_INSIGHTFACE_PROVIDER = process.env.PULID_INSIGHTFACE_PROVIDER || 'CPU';

// 스냅 생성 참조 가중치
const SNAP_PULID_WEIGHT = parseFloat(process.env.SNAP_PULID_WEIGHT || '0.5');
const SNAP_MAX_ANCHOR_REFS = parseInt(process.env.SNAP_MAX_ANCHOR_REFS || '3', 10);

// 스냅 샘플링 파라미터 (환경변수로 오버라이드 가능)
// steps 30: Flux Dev 커뮤니티 권장 28-50. 20은 디테일 부족.
// guidance 3.5: 복잡한 5블록 프롬프트 준수를 위해. 2.5는 느슨함.
// scheduler 'beta': 중간 단계에 더 많은 디노이징 할당. 미지원 시 'normal' 폴백.
const SNAP_STEPS = parseInt(process.env.SNAP_STEPS || '30', 10);
const SNAP_GUIDANCE = parseFloat(process.env.SNAP_GUIDANCE || '3.5');
const SNAP_SCHEDULER = process.env.SNAP_SCHEDULER || 'beta';

// LoRA Training — 서버별 기본값 테이블
// 환경변수로 개별 오버라이드 가능. 새 서버 추가 시 이 테이블만 수정.
const _LORA_DEFAULTS = {
  // 8188: Windows RTX3090 (24GB) — 검증 완료, 건드리지 말 것
  'http://192.168.0.3:8188': {
    steps:                 1500,
    rank:                  32,
    alpha:                 16,
    learningRate:          0.0004,
    optimizer:             'AdamW8bit',
    gradientCheckpointing: true,
    cacheLatents:          'memory',
    cacheTextEncoder:      'memory',
    blocksToSwap:          0,
    fp8Base:               true,
    transformer:           'flux1-krea-dev.safetensors',
    vae:                   'ae.safetensors',
    clipL:                 'clip_l.safetensors',
    t5:                    't5xxl_fp8_e4m3fn.safetensors',
    loraTrainer:           'comfyui',  // ComfyUI-FluxTrainer (Flux 1)
  },
  // 8189: Linux A100 (40GB) — GPU 2 전용, vLLM은 GPU 0,1 사용
  // 커뮤니티 권장: AdamW8bit + rank 32 + 1200 steps + cosine_with_restarts → ~15-20분, 최고 품질
  // ref: https://civitai.com/articles/11112 (rank32 character sweet spot)
  //      https://discuss.huggingface.co/t/perfect-lora-training-parameters-human-character/147211
  //      https://docs.clore.ai/guides/training/kohya-training (lr 1e-4, cosine_with_restarts, warmup)
  'http://192.168.0.3:8189': {
    // 1200 steps × batch4 / (15이미지 × 10repeats) = 32 가상에포크 — 커뮤니티 sweet spot 20-35
    steps:                 1200,
    rank:                  32,     // 캐릭터 얼굴: rank16은 디테일 부족, 32가 sweet spot (HuggingFace forum)
    alpha:                 16,     // rank/2 — 커뮤니티 표준 (civitai/11112)
    learningRate:          0.0001, // 1e-4 — AdamW8bit 최고 품질 기준값 (clore.ai, HuggingFace forum)
    optimizer:             'AdamW8bit',
    gradientCheckpointing: true,   // bf16 23GB + Flux 57-block activations = 38GB → OOM. GC 필수
    cacheLatents:          'memory',
    cacheTextEncoder:      'memory',
    blocksToSwap:          0,
    fp8Base:               false,  // 23GB bf16 모델: fp8 변환 중 23+12=35GB 피크 → OOM. 불필요
    batchSize:             1,      // Flux 23GB + activations 1.7GB = ~25GB, 40GB에서 안정적
    unetOnly:              true,   // text encoder LoRA 스킵 — 캐릭터 LoRA에 충분, 10-15% 속도 향상
    transformer:           'flux1-krea-dev.safetensors',
    vae:                   'ae.safetensors',
    clipL:                 'clip_l.safetensors',
    t5:                    't5xxl_fp8_e4m3fn.safetensors',
    loraTrainer:           'musubi',
  },
};
const _d = _LORA_DEFAULTS[COMFYUI_BASE_URL] || _LORA_DEFAULTS['http://192.168.0.3:8189'];

const LORA_TRAINING_STEPS        = parseInt(process.env.LORA_TRAINING_STEPS || _d.steps, 10);
const LORA_RANK                  = parseInt(process.env.LORA_RANK || _d.rank, 10);
const LORA_ALPHA                 = parseInt(process.env.LORA_ALPHA || _d.alpha, 10);
const LORA_LEARNING_RATE         = parseFloat(process.env.LORA_LEARNING_RATE || _d.learningRate);
const LORA_OPTIMIZER             = process.env.LORA_OPTIMIZER || _d.optimizer;
const LORA_GRADIENT_CHECKPOINTING = process.env.LORA_GRADIENT_CHECKPOINTING
  ? process.env.LORA_GRADIENT_CHECKPOINTING !== 'false'
  : _d.gradientCheckpointing;
const LORA_CACHE_LATENTS         = process.env.LORA_CACHE_LATENTS || _d.cacheLatents;
const LORA_CACHE_TEXT_ENCODER    = process.env.LORA_CACHE_TEXT_ENCODER || _d.cacheTextEncoder;
const LORA_BLOCKS_TO_SWAP        = parseInt(process.env.LORA_BLOCKS_TO_SWAP ?? _d.blocksToSwap, 10);
const LORA_FP8_BASE              = process.env.LORA_FP8_BASE ? process.env.LORA_FP8_BASE !== 'false' : _d.fp8Base;
const LORA_MODEL_TRANSFORMER     = process.env.LORA_MODEL_TRANSFORMER || _d.transformer;
const LORA_MODEL_VAE             = process.env.LORA_MODEL_VAE || _d.vae;
const LORA_MODEL_CLIP_L          = process.env.LORA_MODEL_CLIP_L || _d.clipL;
const LORA_MODEL_T5              = process.env.LORA_MODEL_T5 || _d.t5;
const LORA_BASE_MODEL            = process.env.LORA_BASE_MODEL || _d.transformer;
const LORA_SUBFOLDER             = process.env.LORA_SUBFOLDER || 'story_engine';
const LORA_TRAINER               = process.env.LORA_TRAINER || _d.loraTrainer || 'comfyui';
const LORA_OPTIMIZER_ARGS        = process.env.LORA_OPTIMIZER_ARGS || _d.optimizerArgs || '';
const LORA_BATCH_SIZE            = parseInt(process.env.LORA_BATCH_SIZE || _d.batchSize || 2, 10);
const LORA_UNET_ONLY             = process.env.LORA_UNET_ONLY ? process.env.LORA_UNET_ONLY !== 'false' : (_d.unetOnly ?? false);

module.exports = {
  COMFYUI_BASE_URL,
  FLUX_KONTEXT_MODEL,
  FACE_THRESHOLD,
  DEFAULT_CANDIDATE_COUNT,
  ANCHOR_WIDTH,
  ANCHOR_HEIGHT,
  ORACLE_USER,
  ORACLE_PASSWORD,
  ORACLE_DSN,
  ORACLE_INSTANT_CLIENT_PATH,
  FLUX_MODEL,
  FLUX_CLIP_L,
  FLUX_T5,
  FLUX_VAE,
  SKIN_LORA_MODEL,
  SKIN_LORA_WEIGHT,
  SKIN_LORA_TRIGGER,
  K_AESTHETIC_LORA,
  K_AEST_WEIGHT: K_AESTHETIC_WEIGHT,
  K_AEST_TRIGGER: K_AESTHETIC_TRIGGER,
  REALISM_LORA,
  REAL_WEIGHT: REALISM_WEIGHT,
  REAL_TRIGGER: REALISM_TRIGGER,
  PULID_MODEL,
  PULID_INSIGHTFACE_PROVIDER,
  SNAP_PULID_WEIGHT,
  SNAP_MAX_ANCHOR_REFS,
  SNAP_STEPS,
  SNAP_GUIDANCE,
  SNAP_SCHEDULER,
  LORA_TRAINING_STEPS,
  LORA_RANK,
  LORA_ALPHA,
  LORA_LEARNING_RATE,
  LORA_OPTIMIZER,
  LORA_BASE_MODEL,
  LORA_SUBFOLDER,
  LORA_GRADIENT_CHECKPOINTING,
  LORA_TRAINER,
  LORA_OPTIMIZER_ARGS,
  LORA_BATCH_SIZE,
  LORA_UNET_ONLY,
  LORA_MODEL_TRANSFORMER,
  LORA_MODEL_VAE,
  LORA_MODEL_CLIP_L,
  LORA_MODEL_T5,
  LORA_CACHE_LATENTS,
  LORA_CACHE_TEXT_ENCODER,
  LORA_BLOCKS_TO_SWAP,
  LORA_FP8_BASE,
  COMFYUI_INPUT_DIR,
};
