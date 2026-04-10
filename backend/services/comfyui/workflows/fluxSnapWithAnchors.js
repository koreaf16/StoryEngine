/**
 * @file services/comfyui/workflows/fluxSnapWithAnchors.js
 * @description LoRA + PuLID(얼굴) 참조 스냅 워크플로우 빌더 (Flux 1 Krea Dev 기반).
 *   - loras: LoRA 학습 완료 에셋 → LoRA 체인 적용
 *   - faceRefs: CHARACTER/NPC 얼굴 앵커 → PuLIDFlux1로 얼굴 정체성 주입
 *   참조가 0개이면 buildFluxSnap과 동일한 그래프를 생성한다.
 * @usage features/episode/snap/service.js에서 호출.
 * @connects ComfyUI Server (PuLIDModelLoader, ApplyPuLIDFlux, LoraLoader)
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
  PULID_MODEL,
  PULID_INSIGHTFACE_PROVIDER,
  SNAP_PULID_WEIGHT,
  SNAP_MAX_ANCHOR_REFS,
  SNAP_STEPS,
  SNAP_GUIDANCE,
  SNAP_SCHEDULER,
} = require('../../../app/config');

const SNAP_WIDTH = 1024;
const SNAP_HEIGHT = 576;

/**
 * LoRA + PuLID(Flux 1) 참조 스냅 워크플로우 빌더.
 *
 * @param {string} renderPrompt - 렌더링 프롬프트
 * @param {number|null} seed
 * @param {Array<{path: string, strength: number, trigger: string}>} loras - LoRA 체인
 * @param {Array<{imageName: string, weight?: number}>} faceRefs - PuLID 얼굴 참조 (CHARACTER/NPC)
 * @param {number} width
 * @param {number} height
 */
function buildFluxSnapWithAnchors(
  renderPrompt,
  seed = null,
  loras = [],
  faceRefs = [],
  width = SNAP_WIDTH,
  height = SNAP_HEIGHT
) {
  const resolvedSeed = seed ?? Math.floor(Math.random() * 2 ** 32);
  const cappedFaceRefs = faceRefs.slice(0, SNAP_MAX_ANCHOR_REFS);
  // Skin LoRA 트리거를 뒤에 배치: LoRA 활성화는 위치 무관하지만,
  // T5 인코더의 attention은 앞쪽 토큰에 집중되므로 씬 묘사가 우선순위를 가져야 함
  const enhancedPrompt = `${renderPrompt}, ${SKIN_LORA_TRIGGER}`;

  const workflow = {
    '10': { class_type: 'VAELoader', inputs: { vae_name: FLUX_VAE } },
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
  let lastClip = ['15', 1];
  let nodeId = 50;

  // ─── LoRA 체인 (캐릭터 정체성) ───────────────────────────────────────────
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

  // ─── PuLID 체인 (얼굴 고정, cubiq/ComfyUI_PuLID 노드명 기준) ─────────────
  if (cappedFaceRefs.length > 0) {
    const pulidLoaderId  = String(nodeId++);
    const pulidEvaId     = String(nodeId++);
    const pulidInsightId = String(nodeId++);

    workflow[pulidLoaderId]  = { class_type: 'PulidFluxModelLoader',      inputs: { pulid_file: PULID_MODEL } };
    workflow[pulidEvaId]     = { class_type: 'PulidFluxEvaClipLoader',    inputs: {} };
    workflow[pulidInsightId] = { class_type: 'PulidFluxInsightFaceLoader', inputs: { provider: PULID_INSIGHTFACE_PROVIDER } };

    for (const ref of cappedFaceRefs) {
      const imgId   = String(nodeId++);
      const applyId = String(nodeId++);

      workflow[imgId] = { class_type: 'LoadImage', inputs: { image: ref.imageName } };
      workflow[applyId] = {
        class_type: 'ApplyPulidFlux',
        inputs: {
          model:         lastModel,
          pulid_flux:    [pulidLoaderId, 0],
          eva_clip:      [pulidEvaId, 0],
          face_analysis: [pulidInsightId, 0],
          image:         [imgId, 0],
          weight:        ref.weight ?? SNAP_PULID_WEIGHT,
          start_at:      0.0,
          end_at:        1.0,
        },
      };
      lastModel = [applyId, 0];
    }
  }

  // ─── ModelSamplingFlux: Flux 1 Dev용 타임스텝 패처 (LoRA+PuLID 이후 적용) ─
  const modelPatcherId = String(nodeId++);
  workflow[modelPatcherId] = {
    class_type: 'ModelSamplingFlux',
    inputs: { model: lastModel, max_shift: 1.15, base_shift: 0.5, width, height },
  };

  // ─── 텍스트 인코딩 + 샘플링 ─────────────────────────────────────────────
  const clipEncodeId = String(nodeId++);
  const guidanceId   = String(nodeId++);
  const guiderId     = String(nodeId++);
  const schedulerId  = String(nodeId++);
  const samplerSelId = String(nodeId++);
  const noiseId      = String(nodeId++);
  const samplerAdvId = String(nodeId++);
  const vaeDecodeId  = String(nodeId++);
  const saveImageId  = String(nodeId++);

  workflow[clipEncodeId] = { class_type: 'CLIPTextEncode', inputs: { text: enhancedPrompt, clip: lastClip } };
  workflow[guidanceId]   = { class_type: 'FluxGuidance',   inputs: { conditioning: [clipEncodeId, 0], guidance: SNAP_GUIDANCE } };
  workflow[guiderId]     = { class_type: 'BasicGuider',    inputs: { model: [modelPatcherId, 0], conditioning: [guidanceId, 0] } };
  workflow[schedulerId]  = { class_type: 'BasicScheduler', inputs: { model: [modelPatcherId, 0], scheduler: SNAP_SCHEDULER, steps: SNAP_STEPS, denoise: 1.0 } };
  workflow[samplerSelId] = { class_type: 'KSamplerSelect', inputs: { sampler_name: 'euler' } };
  workflow[noiseId]      = { class_type: 'RandomNoise',    inputs: { noise_seed: resolvedSeed } };
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
  workflow[vaeDecodeId] = { class_type: 'VAEDecode', inputs: { samples: [samplerAdvId, 0], vae: ['10', 0] } };
  workflow[saveImageId] = { class_type: 'SaveImage', inputs: { images: [vaeDecodeId, 0], filename_prefix: 'snap' } };

  return workflow;
}

module.exports = { buildFluxSnapWithAnchors };
