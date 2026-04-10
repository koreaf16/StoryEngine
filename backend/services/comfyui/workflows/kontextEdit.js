/**
 * @file services/comfyui/workflows/kontextEdit.js
 * @description Flux Kontext Dev + PuLID 기반 파생 이미지 생성 워크플로우 빌더.
 *   - Kontext (ReferenceLatent): conditioning 측에서 참조 이미지 구조/스타일 유지
 *   - PuLID (ApplyPulidFlux): model 측에서 얼굴 정체성 고정
 *   두 메커니즘은 서로 다른 축에서 작동하여 충돌 없이 결합됨.
 * @usage features/visual/derived/service.js에서 호출.
 * @connects ComfyUI Server (ComfyUI-PuLID-Flux 확장 필요)
 * @doc docs/04-visual-factory.md
 */
const {
  FLUX_KONTEXT_MODEL,
  FLUX_CLIP_L,
  FLUX_T5,
  FLUX_VAE,
  PULID_MODEL,
  PULID_INSIGHTFACE_PROVIDER,
} = require('../../../app/config');

/**
 * @param {string} anchorImageName - ComfyUI input에 업로드된 앵커 파일명
 * @param {string} editPrompt      - 편집 지시 (표정/포즈/구도 변경)
 * @param {number|null} seed
 * @param {number} guidance         - FluxGuidance (기본 3.5)
 * @param {number} pulidWeight      - PuLID 얼굴 고정 강도 (0=비활성, 기본 0.65)
 */
function buildKontextEdit(anchorImageName, editPrompt, seed = null, guidance = 3.5, pulidWeight = 0.65) {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2 ** 32);
  const fullPrompt = `${editPrompt} Keep the same face and identity.`;

  const workflow = {
    // --- 모델 로딩 (Kontext Dev) ---
    '10': { class_type: 'VAELoader',      inputs: { vae_name: FLUX_VAE } },
    '12': { class_type: 'UNETLoader',     inputs: { unet_name: FLUX_KONTEXT_MODEL, weight_dtype: 'default' } },
    '11': { class_type: 'DualCLIPLoader', inputs: { clip_name1: FLUX_T5, clip_name2: FLUX_CLIP_L, type: 'flux' } },

    // --- 앵커 이미지 (Kontext 참조 + PuLID 얼굴 참조 공유) ---
    '40': { class_type: 'LoadImage',               inputs: { image: anchorImageName } },
    '41': { class_type: 'ImageScaleToTotalPixels', inputs: { upscale_method: 'lanczos', megapixels: 1, resolution_steps: 8, image: ['40', 0] } },
    '42': { class_type: 'VAEEncode',               inputs: { pixels: ['41', 0], vae: ['10', 0] } },
  };

  let lastModel = ['12', 0];

  // --- PuLID 얼굴 고정 (model 패치 — Kontext와 다른 축) ---
  if (pulidWeight > 0) {
    workflow['31'] = { class_type: 'PulidFluxModelLoader',       inputs: { pulid_file: PULID_MODEL } };
    workflow['32'] = { class_type: 'PulidFluxEvaClipLoader',     inputs: {} };
    workflow['33'] = { class_type: 'PulidFluxInsightFaceLoader', inputs: { provider: PULID_INSIGHTFACE_PROVIDER } };
    workflow['34'] = {
      class_type: 'ApplyPulidFlux',
      inputs: {
        model:         lastModel,
        pulid_flux:    ['31', 0],
        eva_clip:      ['32', 0],
        face_analysis: ['33', 0],
        image:         ['40', 0],
        weight:        pulidWeight,
        start_at:      0.0,
        end_at:        1.0,
      },
    };
    lastModel = ['34', 0];
  }

  // --- 텍스트 인코딩 + 가이던스 + ReferenceLatent (Kontext conditioning) ---
  workflow['6']  = { class_type: 'CLIPTextEncode',  inputs: { text: fullPrompt, clip: ['11', 0] } };
  workflow['26'] = { class_type: 'FluxGuidance',    inputs: { conditioning: ['6', 0], guidance } };
  workflow['39'] = { class_type: 'ReferenceLatent', inputs: { conditioning: ['26', 0], latent: ['42', 0] } };
  workflow['22'] = { class_type: 'BasicGuider',     inputs: { model: lastModel, conditioning: ['39', 0] } };

  // --- 샘플링 (denoise 1.0, Kontext 표준) ---
  workflow['47'] = { class_type: 'EmptyLatentImage',    inputs: { width: 1024, height: 1024, batch_size: 1 } };
  workflow['48'] = { class_type: 'BasicScheduler',      inputs: { model: lastModel, scheduler: 'simple', steps: 28, denoise: 1.0 } };
  workflow['16'] = { class_type: 'KSamplerSelect',      inputs: { sampler_name: 'euler' } };
  workflow['25'] = { class_type: 'RandomNoise',         inputs: { noise_seed: resolvedSeed } };
  workflow['13'] = {
    class_type: 'SamplerCustomAdvanced',
    inputs: {
      noise:        ['25', 0],
      guider:       ['22', 0],
      sampler:      ['16', 0],
      sigmas:       ['48', 0],
      latent_image: ['47', 0],
    },
  };

  // --- 디코딩 + 저장 ---
  workflow['8'] = { class_type: 'VAEDecode', inputs: { samples: ['13', 0], vae: ['10', 0] } };
  workflow['9'] = { class_type: 'SaveImage', inputs: { images: ['8', 0], filename_prefix: 'kontext_edit' } };

  return workflow;
}

module.exports = { buildKontextEdit };
