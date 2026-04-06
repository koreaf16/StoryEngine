/**
 * @file services/comfyui/workflows/fluxSnap.js
 * @description Flux 2 Dev 텍스트→이미지 스냅 워크플로우 빌더 (LoRA 지원). 스토리보드 프리뷰 + Wan 2.2 I2V 시작 프레임 용도.
 * @usage features/episode/snap/service.js에서 호출.
 * @connects ComfyUI Server
 * @doc docs/05-episode.md (5. 스냅 이미지 생성)
 */
const { FLUX2_MODEL, FLUX2_CLIP, FLUX2_VAE } = require('../../../app/config');

const SNAP_WIDTH = 1024;
const SNAP_HEIGHT = 576;
const SNAP_STEPS = 20;

/**
 * Flux 2 Dev 텍스트→이미지 스냅 워크플로우 빌더 (LoRA 지원).
 * - render_prompt를 스타일 모디파이어 없이 그대로 사용
 * - 해상도: 1024×576 (16:9 landscape)
 * - loras: [{ path: 'filename.safetensors', strength: 1.0 }] 배열을 받아 체인 연결
 */
function buildFluxSnap(renderPrompt, seed = null, loras = [], width = SNAP_WIDTH, height = SNAP_HEIGHT) {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2 ** 32);

  const workflow = {
    '10': { class_type: 'VAELoader',  inputs: { vae_name: FLUX2_VAE } },
    '12': { class_type: 'UNETLoader', inputs: { unet_name: FLUX2_MODEL, weight_dtype: 'default' } },
    '38': { class_type: 'CLIPLoader', inputs: { clip_name: FLUX2_CLIP, type: 'flux2', device: 'default' } },
    '5':  { class_type: 'EmptyFlux2LatentImage', inputs: { width, height, batch_size: 1 } },
    '7':  { class_type: 'CLIPTextEncode', inputs: { text: '', clip: ['38', 0] } },
  };

  let lastModel = ['12', 0];
  let lastClip  = ['38', 0];
  let nodeId = 50; // 고정 노드(5,7,10,12,38)와 충돌 방지

  // LoRA 체인
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

  // 텍스트 인코딩 + Flux 2 샘플링
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
    inputs: { text: renderPrompt, clip: lastClip },
  };
  workflow[guidanceId] = {
    class_type: 'FluxGuidance',
    inputs: { conditioning: [clipEncodeId, 0], guidance: 3.5 },
  };
  workflow[guiderId] = {
    class_type: 'BasicGuider',
    inputs: { model: lastModel, conditioning: [guidanceId, 0] },
  };
  workflow[schedulerId] = {
    class_type: 'Flux2Scheduler',
    inputs: { steps: SNAP_STEPS, width, height },
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
