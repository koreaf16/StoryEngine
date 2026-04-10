/**
 * @file features/episode/snap/loraDeployer.js
 * @description ComfyUI 서버에 필요한 LoRA 파일이 있는지 확인하고, 없으면 DB에서 꺼내 배포한다.
 */
const { comfyui } = require('../../../services/comfyui/client');
const { storage } = require('../../../storage/oracle/blobStorage');
const { logInfo, logError } = require('../../../app/logger');

/**
 * 샷 생성에 필요한 LoRA들이 ComfyUI 서버에 배포되어 있는지 확인하고, 없으면 배포한다.
 * @param {Array<{path: string, loraId: string}>} loras 
 */
async function ensureLorasDeployed(loras) {
  if (!loras || loras.length === 0) return;

  try {
    const available = await comfyui.getAvailableLoras();
    const availableSet = new Set(available.map(name => name.replace(/\\/g, '/')));

    for (const lora of loras) {
      const targetPath = lora.path.replace(/\\/g, '/');
      if (availableSet.has(targetPath)) {
        continue;
      }

      logInfo('loraDeployer.deploy', `Deploying LoRA to ComfyUI: ${targetPath}`);
      const buffer = await storage.getFileBytes(lora.loraId);
      await comfyui.deployLora(buffer, lora.path);
    }
  } catch (err) {
    logError('loraDeployer.ensure', err);
    // 배포 실패해도 생성 시도를 위해 에러를 던지지는 않음 (ComfyUI가 알아서 skip하거나 에러낼 것)
  }
}

module.exports = { ensureLorasDeployed };
