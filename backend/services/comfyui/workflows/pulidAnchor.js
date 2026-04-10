/**
 * @file services/comfyui/workflows/pulidAnchor.js
 * @description PuLID + Flux 1 Krea Dev 참조 사진 기반 앵커 생성 워크플로우 빌더.
 * @usage features/visual/anchor/service.js에서 호출.
 * @connects ComfyUI Server (ComfyUI-PuLID-Flux 확장 필요)
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
  PULID_MODEL,
  ANCHOR_WIDTH,
  ANCHOR_HEIGHT,
  PULID_INSIGHTFACE_PROVIDER,
} = require('../../../app/config');
const { wrapWithStyle } = require('./visualStyleModifiers');

function buildPulidAnchor(
  prompt,
  visualStyle = 'PHOTOREALISTIC',
  assetType = 'CHARACTER',
  imageName,
  seed = null,
  width = ANCHOR_WIDTH,
  height = ANCHOR_HEIGHT,
  strength = 0.8
) {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2 ** 32);
  const enhancedPrompt = `${SKIN_LORA_TRIGGER}, ${wrapWithStyle(prompt, visualStyle, assetType)}`;

  return {
    // --- 모델 로딩 ---
    '10': { class_type: 'VAELoader', inputs: { vae_name: FLUX_VAE } },
    '12': { class_type: 'UNETLoader', inputs: { unet_name: FLUX_MODEL, weight_dtype: 'default' } },
    '11': {
      class_type: 'DualCLIPLoader',
      inputs: { clip_name1: FLUX_T5, clip_name2: FLUX_CLIP_L, type: 'flux' },
    },
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

    // --- PuLID (cubiq/ComfyUI_PuLID 노드명 기준) ---
    '30': { class_type: 'LoadImage', inputs: { image: imageName } },
    '31': { class_type: 'PulidFluxModelLoader', inputs: { pulid_file: PULID_MODEL } },
    '32': { class_type: 'PulidFluxEvaClipLoader', inputs: {} },
    '33': { class_type: 'PulidFluxInsightFaceLoader', inputs: { provider: PULID_INSIGHTFACE_PROVIDER } },
    '34': {
      class_type: 'ApplyPulidFlux',
      inputs: {
        model:        ['15', 0],
        pulid_flux:   ['31', 0],
        eva_clip:     ['32', 0],
        face_analysis: ['33', 0],
        image:        ['30', 0],
        weight:       strength,
        start_at:     0.0,
        end_at:       1.0,
      },
    },

    // --- ModelSamplingFlux: Flux 1 Dev용 타임스텝 패처 (PuLID 이후 적용) ---
    '20': {
      class_type: 'ModelSamplingFlux',
      inputs: { model: ['34', 0], max_shift: 1.15, base_shift: 0.5, width, height },
    },

    // --- 텍스트 인코딩 + 가이던스 ---
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: { text: enhancedPrompt, clip: ['15', 1] },
    },
    '26': { class_type: 'FluxGuidance', inputs: { conditioning: ['6', 0], guidance: 2.5 } },
    '22': { class_type: 'BasicGuider', inputs: { model: ['20', 0], conditioning: ['26', 0] } },

    // --- 샘플링 ---
    '47': { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    '48': { class_type: 'BasicScheduler', inputs: { model: ['20', 0], scheduler: 'simple', steps: 20, denoise: 1.0 } },
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

    // --- 디코딩 + 저장 ---
    '8': { class_type: 'VAEDecode', inputs: { samples: ['13', 0], vae: ['10', 0] } },
    '9': { class_type: 'SaveImage', inputs: { images: ['8', 0], filename_prefix: 'pulid_anchor' } },
  };
}

module.exports = { buildPulidAnchor };
