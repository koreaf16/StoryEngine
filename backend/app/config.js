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
const _isA100 = COMFYUI_BASE_URL === 'http://192.168.0.3:8189';

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

// Flux 2 Dev 모델명 (ComfyUI에 등록된 파일명 그대로)
const FLUX2_MODEL = 'flux2_dev_fp8mixed.safetensors';
const FLUX2_CLIP = 'mistral_3_small_flux2_fp8.safetensors';
const FLUX2_VAE = 'flux2-vae.safetensors';

// PuLID Flux 모델 (ComfyUI-PuLID-Flux2 확장 필요)
const PULID_MODEL = process.env.PULID_MODEL || 'pulid_flux2_klein_v2.safetensors';
const PULID_INSIGHTFACE_PROVIDER = process.env.PULID_INSIGHTFACE_PROVIDER || 'CPU';

// 스냅 생성 참조 가중치
const SNAP_PULID_WEIGHT = parseFloat(process.env.SNAP_PULID_WEIGHT || '0.5');
const SNAP_IPADAPTER_WEIGHT = parseFloat(process.env.SNAP_IPADAPTER_WEIGHT || '0.6');
const SNAP_MAX_ANCHOR_REFS = parseInt(process.env.SNAP_MAX_ANCHOR_REFS || '3', 10);

// IP-Adapter Flux 모델
const IPADAPTER_FLUX_MODEL = process.env.IPADAPTER_FLUX_MODEL || 'ip-adapter.bin';
const IPADAPTER_CLIP_VISION = process.env.IPADAPTER_CLIP_VISION || 'google/siglip-so400m-patch14-384';
const IPADAPTER_PROVIDER = process.env.IPADAPTER_PROVIDER || 'cuda';

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
    transformer:           'FLUX1\\flux1-dev-fp8.safetensors',
    vae:                   'ae.safetensors',
    clipL:                 'clip_l.safetensors',
    t5:                    't5xxl_fp8_e4m3fn.safetensors',
  },
  // 8189: Linux A100 (40GB) — VRAM 15GB 사용 / 25GB 여유 확인 (2026-04-06)
  'http://192.168.0.3:8189': {
    steps:                 1500,
    rank:                  64,     // 15장 → rank 64 적용 (25GB 여유 활용)
    alpha:                 32,
    learningRate:          0.0004,
    optimizer:             'AdamW8bit',
    gradientCheckpointing: true,    // false 시 40GB에서도 OOM 확인 → enabled 고정
    cacheLatents:          'memory',
    cacheTextEncoder:      'memory',
    blocksToSwap:          0,
    fp8Base:               false,   // bf16 베이스 (+8GB) → gradient 정밀도 향상
    transformer:           'FLUX1/flux1-dev-fp8.safetensors',
    vae:                   'ae.safetensors',
    clipL:                 'clip_l.safetensors',
    t5:                    't5xxl_fp8_e4m3fn.safetensors',
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

// Flux 1 Dev — 현재 미사용 (레거시). 스냅/LoRA 모두 Flux 2로 전환 완료.
const FLUX_MODEL = 'flux1-dev-fp8.safetensors';

module.exports = {
  COMFYUI_BASE_URL,
  FACE_THRESHOLD,
  DEFAULT_CANDIDATE_COUNT,
  ANCHOR_WIDTH,
  ANCHOR_HEIGHT,
  ORACLE_USER,
  ORACLE_PASSWORD,
  ORACLE_DSN,
  ORACLE_INSTANT_CLIENT_PATH,
  FLUX2_MODEL,
  FLUX2_CLIP,
  FLUX2_VAE,
  PULID_MODEL,
  PULID_INSIGHTFACE_PROVIDER,
  LORA_TRAINING_STEPS,
  LORA_RANK,
  LORA_LEARNING_RATE,
  LORA_OPTIMIZER,
  LORA_BASE_MODEL,
  LORA_SUBFOLDER,
  SNAP_PULID_WEIGHT,
  SNAP_IPADAPTER_WEIGHT,
  SNAP_MAX_ANCHOR_REFS,
  IPADAPTER_FLUX_MODEL,
  IPADAPTER_CLIP_VISION,
  IPADAPTER_PROVIDER,
  FLUX_MODEL,
  COMFYUI_INPUT_DIR,
  LORA_ALPHA,
  LORA_GRADIENT_CHECKPOINTING,
  LORA_MODEL_TRANSFORMER,
  LORA_MODEL_VAE,
  LORA_MODEL_CLIP_L,
  LORA_MODEL_T5,
  LORA_CACHE_LATENTS,
  LORA_CACHE_TEXT_ENCODER,
  LORA_BLOCKS_TO_SWAP,
  LORA_FP8_BASE,
};
