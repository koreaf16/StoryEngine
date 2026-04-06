/**
 * @file services/comfyui/workflows/fluxSnapWithAnchors.js
 * @description PuLID(얼굴) + IP-Adapter(의상/스타일) + LoRA 3중 참조 스냅 워크플로우 빌더.
 *   Flux 2 Dev 기반. pulidAnchor.js와 동일한 노드 구조 사용.
 *   - faceRefs: CHARACTER/NPC 얼굴 앵커 → PuLIDFlux2로 얼굴 정체성 주입
 *   - styleRefs: 모든 에셋 타입 의상/스타일 앵커 → IP-Adapter로 비주얼 참조 주입
 *   - loras: LoRA 학습 완료 에셋 → LoRA 체인 적용
 *   참조가 0개이면 buildFluxSnap과 동일한 Flux 2 그래프를 생성한다.
 * @usage features/episode/snap/service.js에서 호출.
 * @connects ComfyUI Server (IPAdapterFluxLoader, ApplyIPAdapterFlux, PuLIDModelLoader, ApplyPuLIDFlux2, LoraLoader)
 * @doc docs/05-episode.md (5. 스냅 이미지 생성)
 */
const {
  FLUX2_MODEL,
  FLUX2_CLIP,
  FLUX2_VAE,
  PULID_MODEL,
  PULID_INSIGHTFACE_PROVIDER,
  IPADAPTER_FLUX_MODEL,
  IPADAPTER_CLIP_VISION,
  IPADAPTER_PROVIDER,
  SNAP_PULID_WEIGHT,
  SNAP_IPADAPTER_WEIGHT,
  SNAP_MAX_ANCHOR_REFS,
} = require('../../../app/config');

const SNAP_WIDTH = 1024;
const SNAP_HEIGHT = 576;
const SNAP_STEPS = 20;

/**
 * PuLID(Flux 2) + IP-Adapter + LoRA 3중 참조 스냅 워크플로우 빌더.
 *
 * @param {string} renderPrompt - 렌더링 프롬프트 (의상 묘사 포함)
 * @param {number|null} seed
 * @param {Array<{path: string, strength: number, trigger: string}>} loras - Tier 1 LoRA
 * @param {Array<{imageName: string, weight?: number}>} faceRefs - PuLID 얼굴 참조 (CHARACTER/NPC)
 * @param {Array<{imageName: string, weight?: number}>} styleRefs - IP-Adapter 스타일 참조 (모든 에셋)
 * @param {number} width
 * @param {number} height
 */
function buildFluxSnapWithAnchors(
  renderPrompt,
  seed = null,
  loras = [],
  faceRefs = [],
  styleRefs = [],
  width = SNAP_WIDTH,
  height = SNAP_HEIGHT
) {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2 ** 32);
  const cappedFaceRefs = faceRefs.slice(0, SNAP_MAX_ANCHOR_REFS);
  const cappedStyleRefs = styleRefs.slice(0, SNAP_MAX_ANCHOR_REFS);

  // 고정 노드: Flux 2 Dev 모델 로더 + 레이턴트
  const workflow = {
    '10': { class_type: 'VAELoader', inputs: { vae_name: FLUX2_VAE } },
    '12': { class_type: 'UNETLoader', inputs: { unet_name: FLUX2_MODEL, weight_dtype: 'default' } },
    '38': { class_type: 'CLIPLoader', inputs: { clip_name: FLUX2_CLIP, type: 'flux2', device: 'default' } },
    '5':  { class_type: 'EmptyFlux2LatentImage', inputs: { width, height, batch_size: 1 } },
    '7':  { class_type: 'CLIPTextEncode', inputs: { text: '', clip: ['38', 0] } },
  };

  let lastModel = ['12', 0];
  let lastClip = ['38', 0];
  let nodeId = 50; // 고정 노드(5,7,10,12,38)와 충돌 방지

  // ─── LoRA 체인 ────────────────────────────────────────────────────────────
  if (Array.isArray(loras) && loras.length > 0) {
    for (const lora of loras) {
      const id = String(nodeId++);
      workflow[id] = {
        class_type: 'LoraLoader',
        inputs: {
          lora_name: lora.path,
          strength_model: lora.strength ?? 1.0,
          strength_clip: 1.0,
          model: lastModel,
          clip: lastClip,
        },
      };
      lastModel = [id, 0];
      lastClip = [id, 1];
    }
  }

  // ─── PuLID 체인 (Flux 2 노드 타입) ───────────────────────────────────────
  if (cappedFaceRefs.length > 0) {
    const pulidLoaderId = String(nodeId++);
    const pulidEvaId    = String(nodeId++);
    const pulidInsightId = String(nodeId++);

    workflow[pulidLoaderId]  = { class_type: 'PuLIDModelLoader',      inputs: { pulid_file: PULID_MODEL } };
    workflow[pulidEvaId]     = { class_type: 'PuLIDEVACLIPLoader',    inputs: {} };
    workflow[pulidInsightId] = { class_type: 'PuLIDInsightFaceLoader', inputs: { provider: PULID_INSIGHTFACE_PROVIDER } };

    for (const ref of cappedFaceRefs) {
      const imgId   = String(nodeId++);
      const applyId = String(nodeId++);

      workflow[imgId] = { class_type: 'LoadImage', inputs: { image: ref.imageName } };
      workflow[applyId] = {
        class_type: 'ApplyPuLIDFlux2',
        inputs: {
          model:         lastModel,
          pulid_model:   [pulidLoaderId, 0],
          eva_clip:      [pulidEvaId, 0],
          face_analysis: [pulidInsightId, 0],
          image:         [imgId, 0],
          strength:      ref.weight ?? SNAP_PULID_WEIGHT,
        },
      };
      lastModel = [applyId, 0];
    }
  }

  // ─── IP-Adapter 체인 ──────────────────────────────────────────────────────
  if (cappedStyleRefs.length > 0) {
    const ipaLoaderId = String(nodeId++);
    workflow[ipaLoaderId] = {
      class_type: 'IPAdapterFluxLoader',
      inputs: {
        ipadapter:   IPADAPTER_FLUX_MODEL,
        clip_vision: IPADAPTER_CLIP_VISION,
        provider:    IPADAPTER_PROVIDER,
      },
    };

    for (const ref of cappedStyleRefs) {
      const imgId   = String(nodeId++);
      const applyId = String(nodeId++);

      workflow[imgId] = { class_type: 'LoadImage', inputs: { image: ref.imageName } };
      workflow[applyId] = {
        class_type: 'ApplyIPAdapterFlux',
        inputs: {
          model:          lastModel,
          ipadapter_flux: [ipaLoaderId, 0],
          image:          [imgId, 0],
          weight:         ref.weight ?? SNAP_IPADAPTER_WEIGHT,
          start_percent:  0.0,
          end_percent:    1.0,
        },
      };
      lastModel = [applyId, 0];
    }
  }

  // ─── 텍스트 인코딩 + Flux 2 샘플링 ──────────────────────────────────────
  const clipEncodeId   = String(nodeId++);
  const guidanceId     = String(nodeId++);
  const guiderId       = String(nodeId++);
  const schedulerId    = String(nodeId++);
  const samplerSelId   = String(nodeId++);
  const noiseId        = String(nodeId++);
  const samplerAdvId   = String(nodeId++);
  const vaeDecodeId    = String(nodeId++);
  const saveImageId    = String(nodeId++);

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

module.exports = { buildFluxSnapWithAnchors };
