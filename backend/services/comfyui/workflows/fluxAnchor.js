/**
 * @file services/comfyui/workflows/fluxAnchor.js
 * @description Flux 1 Krea Dev 기반 텍스트→이미지 앵커 생성 워크플로우 빌더.
 * @usage features/visual/anchor/service.js에서 호출.
 * @connects ComfyUI Server
 * @doc docs/04-visual-factory.md
 */
const {
  FLUX_MODEL,
  FLUX_CLIP_L,
  FLUX_T5,
  FLUX_VAE,
  SKIN_LORA_MODEL,
  SKIN_LORA_WEIGHT,
  SKIN_LORA_TRIGGER,
  K_AESTHETIC_LORA,
  K_AEST_WEIGHT,
  K_AEST_TRIGGER,
  REALISM_LORA,
  REAL_WEIGHT,
  REAL_TRIGGER,
  ANCHOR_WIDTH,
  ANCHOR_HEIGHT,
} = require('../../../app/config');
const { wrapWithStyle } = require('./visualStyleModifiers');

function buildFluxAnchor(prompt, visualStyle = 'PHOTOREALISTIC', assetType = 'CHARACTER', seed = null, width = ANCHOR_WIDTH, height = ANCHOR_HEIGHT, options = {}) {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2 ** 32);
  const guidance = options.guidance ?? 3.5;
  const loraWeight = options.loraWeight ?? K_AEST_WEIGHT;
  
  // 트리거 워드 조합
  const triggers = [SKIN_LORA_TRIGGER, K_AEST_TRIGGER, REAL_TRIGGER].join(', ');
  const enhancedPrompt = `${triggers}, ${wrapWithStyle(prompt, visualStyle, assetType)}`;

  return {
    '10': { class_type: 'VAELoader', inputs: { vae_name: FLUX_VAE } },
    '12': { class_type: 'UNETLoader', inputs: { unet_name: FLUX_MODEL, weight_dtype: 'default' } },
    '11': {
      class_type: 'DualCLIPLoader',
      inputs: { clip_name1: FLUX_T5, clip_name2: FLUX_CLIP_L, type: 'flux' },
    },
    // LoRA 1: Skin Texture
    '15': {
      class_type: 'LoraLoader',
      inputs: {
        lora_name: SKIN_LORA_MODEL,
        strength_model: SKIN_LORA_WEIGHT,
        strength_clip: 1.0,
        model: ['12', 0],
        clip: ['11', 0],
      },
    },
    // LoRA 2: Korean Aesthetic (미형)
    '17': {
      class_type: 'LoraLoader',
      inputs: {
        lora_name: K_AESTHETIC_LORA,
        strength_model: loraWeight,
        strength_clip: 1.0,
        model: ['15', 0],
        clip: ['15', 1],
      },
    },
    // ModelSamplingFlux: Flux 1 Dev용 모델 패처 (타임스텝 시프트 설정)
    '20': {
      class_type: 'ModelSamplingFlux',
      inputs: { model: ['17', 0], max_shift: 0.5, base_shift: 1.15, width, height },
    },
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: { text: enhancedPrompt, clip: ['17', 1] },
    },
    '26': { class_type: 'FluxGuidance', inputs: { conditioning: ['6', 0], guidance: guidance } },
    '22': { class_type: 'BasicGuider', inputs: { model: ['20', 0], conditioning: ['26', 0] } },
    '47': { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    '48': { class_type: 'BasicScheduler', inputs: { model: ['20', 0], scheduler: 'beta', steps: 28, denoise: 1.0 } },
    '16': { class_type: 'KSamplerSelect', inputs: { sampler_name: 'euler' } },
    '25': { class_type: 'RandomNoise', inputs: { noise_seed: resolvedSeed } },
    '13': {
      class_type: 'SamplerCustomAdvanced',
      inputs: {
        noise: ['25', 0],
        guider: ['22', 0],
        sampler: ['16', 0],
        sigmas: ['48', 0],
        latent_image: ['47', 0],
      },
    },
    '8': { class_type: 'VAEDecode', inputs: { samples: ['13', 0], vae: ['10', 0] } },
    '9': { class_type: 'SaveImage', inputs: { images: ['8', 0], filename_prefix: 'anchor' } },
  };
}

module.exports = { buildFluxAnchor };
