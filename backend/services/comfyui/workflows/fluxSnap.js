/**
 * @file services/comfyui/workflows/fluxSnap.js
 * @description Flux 1 Krea Dev 텍스트→이미지 스냅 워크플로우 빌더 (LoRA 지원). 스토리보드 프리뷰 + Wan 2.2 I2V 시작 프레임 용도.
 * @usage features/episode/snap/service.js에서 호출.
 * @connects ComfyUI Server
 * @doc docs/05-episode.md (5. 스냅 이미지 생성)
 */
const {
  FLUX_MODEL,
  FLUX_CLIP_L,
  FLUX_T5,
  FLUX_VAE,
  SKIN_LORA_MODEL,
  SKIN_LORA_WEIGHT,
  SKIN_LORA_TRIGGER,
  SNAP_STEPS,
  SNAP_GUIDANCE,
  SNAP_SCHEDULER,
} = require('../../../app/config');

const SNAP_WIDTH = 1024;
const SNAP_HEIGHT = 576;

/**
 * Flux 1 Krea Dev 기반 텍스트→이미지 스냅 워크플로우 빌더 (Skin LoRA 기본 적용).
 * - render_prompt 앞부분에 SKIN_LORA_TRIGGER 자동 삽입
 * - 해상도: 1024×576 (16:9 landscape)
 * - loras: [{ path: 'filename.safetensors', strength: 1.0 }] 배열을 받아 체인 연결
 */
function buildFluxSnap(renderPrompt, seed = null, loras = [], width = SNAP_WIDTH, height = SNAP_HEIGHT) {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2 ** 32);
  const enhancedPrompt = `${renderPrompt}, ${SKIN_LORA_TRIGGER}`;

  const workflow = {
    '10': { class_type: 'VAELoader',  inputs: { vae_name: FLUX_VAE } },
    '12': { class_type: 'UNETLoader', inputs: { unet_name: FLUX_MODEL, weight_dtype: 'default' } },
    '11': {
      class_type: 'DualCLIPLoader',
      inputs: { clip_name1: FLUX_T5, clip_name2: FLUX_CLIP_L, type: 'flux' },
    },
    '5':  { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
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
  };

  let lastModel = ['15', 0];
  let lastClip  = ['15', 1];
  let nodeId = 50; // 고정 노드와 충돌 방지

  // 캐릭터 전용 LoRA 체인
  if (Array.isArray(loras) && loras.length > 0) {
    for (const lora of loras) {
      const id = String(nodeId++);
      workflow[id] = {
        class_type: 'LoraLoader',
        inputs: {
          lora_name:      lora.path,
          strength_model: lora.strength ?? 1.0,
          strength_clip:  1.0,
          model: lastModel,
          clip:  lastClip,
        },
      };
      lastModel = [id, 0];
      lastClip  = [id, 1];
    }
  }

  // ModelSamplingFlux: Flux 1 Dev용 모델 패처 (LoRA 체인 이후 적용)
  const modelPatcherId = String(nodeId++);
  workflow[modelPatcherId] = {
    class_type: 'ModelSamplingFlux',
    inputs: { model: lastModel, max_shift: 1.15, base_shift: 0.5, width, height },
  };

  // 텍스트 인코딩 + Flux 샘플링
  const clipEncodeId = String(nodeId++);
  const guidanceId   = String(nodeId++);
  const guiderId     = String(nodeId++);
  const schedulerId  = String(nodeId++);
  const samplerSelId = String(nodeId++);
  const noiseId      = String(nodeId++);
  const samplerAdvId = String(nodeId++);
  const vaeDecodeId  = String(nodeId++);
  const saveImageId  = String(nodeId++);

  workflow[clipEncodeId] = {
    class_type: 'CLIPTextEncode',
    inputs: { text: enhancedPrompt, clip: lastClip },
  };
  workflow[guidanceId] = {
    class_type: 'FluxGuidance',
    inputs: { conditioning: [clipEncodeId, 0], guidance: SNAP_GUIDANCE },
  };
  workflow[guiderId] = {
    class_type: 'BasicGuider',
    inputs: { model: [modelPatcherId, 0], conditioning: [guidanceId, 0] },
  };
  workflow[schedulerId] = {
    class_type: 'BasicScheduler',
    inputs: { model: [modelPatcherId, 0], scheduler: SNAP_SCHEDULER, steps: SNAP_STEPS, denoise: 1.0 },
  };
  workflow[samplerSelId] = {
    class_type: 'KSamplerSelect',
    inputs: { sampler_name: 'euler' },
  };
  workflow[noiseId] = {
    class_type: 'RandomNoise',
    inputs: { noise_seed: resolvedSeed },
  };
  workflow[samplerAdvId] = {
    class_type: 'SamplerCustomAdvanced',
    inputs: {
      noise:        [noiseId, 0],
      guider:       [guiderId, 0],
      sampler:      [samplerSelId, 0],
      sigmas:       [schedulerId, 0],
      latent_image: ['5', 0],
    },
  };
  workflow[vaeDecodeId] = {
    class_type: 'VAEDecode',
    inputs: { samples: [samplerAdvId, 0], vae: ['10', 0] },
  };
  workflow[saveImageId] = {
    class_type: 'SaveImage',
    inputs: { images: [vaeDecodeId, 0], filename_prefix: 'snap' },
  };

  return workflow;
}

module.exports = { buildFluxSnap };
