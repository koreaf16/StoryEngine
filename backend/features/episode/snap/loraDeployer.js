/**
 * @file features/episode/snap/loraDeployer.js
 * @description 스냅 생성 전 LoRA 파일이 ComfyUI loras 폴더에 있는지 확인하고,
 *   없으면 Oracle DB BLOB에서 꺼내 ComfyUI에 배포한다.
 *   ComfyUI 머신에 story_engine_api 커스텀 노드가 설치되어 있어야 한다.
 * @usage features/episode/snap/service.js — generateSnapWithMap() 호출 전
 * @connects services/comfyui/client.js, storage/oracle/blobStorage.js
 * @doc docs/05-episode.md (5. 스냅 이미지 생성)
 */
const { comfyui } = require('../../../services/comfyui/client');
const { storage } = require('../../../storage/oracle/blobStorage');
const { logInfo, logWarn, logError } = require('../../../app/logger');

/**
 * 워크플로우에서 사용할 LoRA 목록을 검사하고, ComfyUI에 없는 파일은 DB에서 꺼내 배포한다.
 * 배포 실패 시 에러를 throw하지 않고 경고만 남긴다 (워크플로우 제출 시 ComfyUI가 검증).
 *
 * @param {Array<{path: string, loraId: string|null, strength: number}>} loras
 */
async function ensureLorasDeployed(loras) {
  if (!loras.length) return;

  let available;
  try {
    available = await comfyui.getAvailableLoras();
  } catch (err) {
    logError('loraDeployer.getAvailable', err);
    return;
  }

  const availableSet = new Set(available);

  for (const lora of loras) {
    if (availableSet.has(lora.path)) {
      logInfo('loraDeployer', 'LoRA already in ComfyUI', { path: lora.path });
      continue;
    }

    if (!lora.loraId) {
      logWarn('loraDeployer', 'LoRA missing from ComfyUI — no DB record to deploy', { path: lora.path });
      continue;
    }

    logInfo('loraDeployer', 'Deploying LoRA DB→ComfyUI', { path: lora.path, loraId: lora.loraId });
    const bytes = await storage.getLoraBytes(lora.loraId);
    if (!bytes) {
      logWarn('loraDeployer', 'LoRA BLOB not found in DB', { loraId: lora.loraId });
      continue;
    }

    try {
      await comfyui.deployLora(bytes, lora.path);
      logInfo('loraDeployer', 'LoRA deployed successfully', { path: lora.path, bytes: bytes.length });
    } catch (err) {
      logError('loraDeployer.deploy', err, { path: lora.path });
    }
  }
}

module.exports = { ensureLorasDeployed };
