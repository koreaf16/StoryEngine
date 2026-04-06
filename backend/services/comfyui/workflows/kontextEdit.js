/**
 * @file services/comfyui/workflows/kontextEdit.js
 * @description Flux 2 Dev 기반 파생 이미지 생성 워크플로우 빌더. ReferenceLatent로 앵커 이미지를 참조하여 편집.
 * @usage features/visual/derived/service.js에서 호출.
 * @connects ComfyUI Server
 * @doc docs/04-visual-factory.md
 */
const { FLUX2_MODEL, FLUX2_CLIP, FLUX2_VAE } = require('../../../app/config');

function buildKontextEdit(anchorImageName, editPrompt, seed = null, guidance = 4.0) {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2 ** 32);

  return {
    // --- 모델 로딩 ---
    '10': { class_type: 'VAELoader', inputs: { vae_name: FLUX2_VAE } },
    '12': { class_type: 'UNETLoader', inputs: { unet_name: FLUX2_MODEL, weight_dtype: 'default' } },
    '38': { class_type: 'CLIPLoader', inputs: { clip_name: FLUX2_CLIP, type: 'flux2', device: 'default' } },

    // --- 참조 이미지 인코딩 ---
    '40': { class_type: 'LoadImage', inputs: { image: anchorImageName } },
    '41': { class_type: 'ImageScaleToTotalPixels', inputs: { upscale_method: 'area', megapixels: 1, resolution_steps: 8, image: ['40', 0] } },
    '42': { class_type: 'VAEEncode', inputs: { pixels: ['41', 0], vae: ['10', 0] } },

    // --- 텍스트 인코딩 + 가이던스 + ReferenceLatent ---
    '6': { class_type: 'CLIPTextEncode', inputs: { text: editPrompt, clip: ['38', 0] } },
    '26': { class_type: 'FluxGuidance', inputs: { conditioning: ['6', 0], guidance } },
    '39': { class_type: 'ReferenceLatent', inputs: { conditioning: ['26', 0], latent: ['42', 0] } },
    '22': { class_type: 'BasicGuider', inputs: { model: ['12', 0], conditioning: ['39', 0] } },

    // --- 샘플링 ---
    '47': { class_type: 'EmptyFlux2LatentImage', inputs: { width: 1024, height: 1024, batch_size: 1 } },
    '48': { class_type: 'Flux2Scheduler', inputs: { steps: 20, width: 1024, height: 1024 } },
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
    '9': { class_type: 'SaveImage', inputs: { images: ['8', 0], filename_prefix: 'flux2_edit' } },
  };
}

module.exports = { buildKontextEdit };
