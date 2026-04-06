/**
 * @file services/comfyui/workflows/fluxLoraTraining.js
 * @description Flux 1 Dev LoRA 학습 워크플로우 빌더.
 *   FluxTrainModelSelect → TrainDatasetGeneralConfig + TrainDatasetAdd →
 *   OptimizerConfig → InitFluxLoRATraining → FluxTrainLoop → FluxTrainEnd
 * @usage features/visual/lora/service.js에서 호출.
 * @connects app/config.js
 * @doc docs/04-visual-factory.md
 */
const {
  LORA_OPTIMIZER, LORA_RANK, LORA_ALPHA, LORA_GRADIENT_CHECKPOINTING,
  LORA_MODEL_TRANSFORMER, LORA_MODEL_VAE, LORA_MODEL_CLIP_L, LORA_MODEL_T5,
  LORA_CACHE_LATENTS, LORA_CACHE_TEXT_ENCODER, LORA_BLOCKS_TO_SWAP, LORA_FP8_BASE,
} = require('../../../app/config');

/**
 * @param {string[]} _imageNames  - 업로드된 이미지 파일명 목록 (사용 안 함 — dataset_path 방식 사용)
 * @param {string}   triggerWord  - 캐릭터 트리거 단어
 * @param {string}   loraName     - LoRA 출력 파일 기본명 (확장자 없음)
 * @param {object}   options
 *   @param {number}  options.steps          - 총 학습 스텝
 *   @param {number}  options.rank           - LoRA rank
 *   @param {number}  options.learningRate
 *   @param {string}  options.optimizer      - 옵티마이저 타입 (adamw8bit 등)
 *   @param {string}  options.datasetSubfolder - ComfyUI root 기준 이미지 폴더 경로 (예: input/lora_han_soyul)
 *   @param {number}  options.imageCount     - 이미지 수 (num_repeats 자동 계산용)
 *   @param {string}  options.outputDir      - LoRA 저장 폴더 (ComfyUI root 기준, 기본 'output')
 */
function buildFluxLoraTraining(_imageNames, triggerWord, loraName, options = {}) {
  const {
    steps                = 1500,
    rank                 = LORA_RANK,
    alpha                = LORA_ALPHA,
    learningRate         = 0.0004,
    optimizer            = LORA_OPTIMIZER,
    datasetSubfolder     = 'input/lora_images',
    imageCount           = 15,
    outputDir            = 'output',
    gradientCheckpointing = LORA_GRADIENT_CHECKPOINTING,
  } = options;

  // 이미지 수에 따라 num_repeats 조정: 총 steps / imageCount ≈ 한 에폭당 steps
  const numRepeats = Math.max(1, Math.ceil(steps / Math.max(1, imageCount)));
  // optimizerType: 내부 값(AdamW8bit → adamw8bit)으로 정규화
  const optimizerType = optimizer.toLowerCase().replace(/^adamw8bit$/, 'adamw8bit').replace(/^adamw$/, 'adamw');

  const workflow = {};

  // ── 1: FluxTrainModelSelect ──
  workflow['1'] = {
    class_type: 'FluxTrainModelSelect',
    inputs: {
      transformer: LORA_MODEL_TRANSFORMER,
      vae:         LORA_MODEL_VAE,
      clip_l:      LORA_MODEL_CLIP_L,
      t5:          LORA_MODEL_T5,
    },
  };

  // ── 2: TrainDatasetGeneralConfig ──
  workflow['2'] = {
    class_type: 'TrainDatasetGeneralConfig',
    inputs: {
      color_aug:             false,
      flip_aug:              false,
      shuffle_caption:       false,
      caption_dropout_rate:  0.0,
      alpha_mask:            false,
    },
  };

  // ── 3: TrainDatasetAdd ──
  // dataset_path: ComfyUI root(ComfyUI_windows_portable) 기준 상대 경로
  workflow['3'] = {
    class_type: 'TrainDatasetAdd',
    inputs: {
      dataset_config:    ['2', 0],
      width:             512,
      height:            512,
      batch_size:        1,
      dataset_path:      datasetSubfolder,
      class_tokens:      triggerWord,
      enable_bucket:     true,
      bucket_no_upscale: false,
      num_repeats:       numRepeats,
      min_bucket_reso:   256,
      max_bucket_reso:   1024,
    },
  };

  // ── 4: OptimizerConfig ──
  workflow['4'] = {
    class_type: 'OptimizerConfig',
    inputs: {
      optimizer_type:          optimizerType,
      max_grad_norm:           1.0,
      lr_scheduler:            'constant',
      lr_warmup_steps:         0,
      lr_scheduler_num_cycles: 1,
      lr_scheduler_power:      1.0,
      min_snr_gamma:           5.0,
      extra_optimizer_args:    '',
    },
  };

  // ── 5: InitFluxLoRATraining ──
  workflow['5'] = {
    class_type: 'InitFluxLoRATraining',
    inputs: {
      flux_models:                   ['1', 0],
      dataset:                       ['3', 0],
      optimizer_settings:            ['4', 0],
      output_name:                   loraName,
      output_dir:                    outputDir,
      network_dim:                   rank,
      network_alpha:                 alpha,
      learning_rate:                 learningRate,
      max_train_steps:               steps,
      apply_t5_attn_mask:            true,
      cache_latents:                 LORA_CACHE_LATENTS,
      cache_text_encoder_outputs:    LORA_CACHE_TEXT_ENCODER,
      blocks_to_swap:                LORA_BLOCKS_TO_SWAP,
      weighting_scheme:              'logit_normal',
      logit_mean:                    0.0,
      logit_std:                     1.0,
      mode_scale:                    1.29,
      timestep_sampling:             'sigmoid',
      sigmoid_scale:                 1.0,
      model_prediction_type:         'raw',
      guidance_scale:                1.0,
      discrete_flow_shift:           1.0,
      highvram:                      false,
      fp8_base:                      LORA_FP8_BASE,
      gradient_dtype:                'fp32',
      save_dtype:                    'bf16',
      attention_mode:                'sdpa',
      sample_prompts:                triggerWord,
      gradient_checkpointing:        gradientCheckpointing ? 'enabled' : 'disabled',
    },
  };

  // ── 6: FluxTrainLoop ──
  workflow['6'] = {
    class_type: 'FluxTrainLoop',
    inputs: {
      network_trainer: ['5', 0],
      steps:           steps,
    },
  };

  // ── 7: FluxTrainEnd (output_node: true) ──
  workflow['7'] = {
    class_type: 'FluxTrainEnd',
    inputs: {
      network_trainer: ['6', 0],
      save_state:      true,
    },
  };

  return workflow;
}

module.exports = { buildFluxLoraTraining };
