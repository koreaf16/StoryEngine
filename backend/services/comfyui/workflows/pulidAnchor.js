/**
 * @file services/comfyui/workflows/pulidAnchor.js
 * @description PuLID + Flux 2 Dev 참조 사진 기반 앵커 생성 워크플로우 빌더.
 * @usage features/visual/anchor/service.js에서 호출.
 * @connects ComfyUI Server (ComfyUI-PuLID-Flux2 확장 필요)
 * @doc docs/04-visual-factory.md
 */
const {
  FLUX2_MODEL,
  FLUX2_CLIP,
  FLUX2_VAE,
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
  strength = 1.4
) {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2 ** 32);

  return {
    // --- 모델 로딩 ---
    '10': { class_type: 'VAELoader', inputs: { vae_name: FLUX2_VAE } },
    '12': { class_type: 'UNETLoader', inputs: { unet_name: FLUX2_MODEL, weight_dtype: 'default' } },
    '38': { class_type: 'CLIPLoader', inputs: { clip_name: FLUX2_CLIP, type: 'flux2', device: 'default' } },

    // --- PuLID Flux 2 ---
    '30': { class_type: 'LoadImage', inputs: { image: imageName } },
    '31': { class_type: 'PuLIDModelLoader', inputs: { pulid_file: PULID_MODEL } },
    '32': { class_type: 'PuLIDEVACLIPLoader', inputs: {} },
    '33': { class_type: 'PuLIDInsightFaceLoader', inputs: { provider: PULID_INSIGHTFACE_PROVIDER } },
    '34': {
      class_type: 'ApplyPuLIDFlux2',
      inputs: {
        model: ['12', 0],
        pulid_model: ['31', 0],
        eva_clip: ['32', 0],
        face_analysis: ['33', 0],
        image: ['30', 0],
        strength,
      },
    },

    // --- 텍스트 인코딩 + 가이던스 ---
    '6': {
      class_type: 'CLIPTextEncode',
      inputs: { text: wrapWithStyle(prompt, visualStyle, assetType), clip: ['38', 0] },
    },
    '26': { class_type: 'FluxGuidance', inputs: { conditioning: ['6', 0], guidance: 4.0 } },
    '22': { class_type: 'BasicGuider', inputs: { model: ['34', 0], conditioning: ['26', 0] } },

    // --- 샘플링 ---
    '47': { class_type: 'EmptyFlux2LatentImage', inputs: { width, height, batch_size: 1 } },
    '48': { class_type: 'Flux2Scheduler', inputs: { steps: 20, width, height } },
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
