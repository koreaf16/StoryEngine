/**
 * @file features/visual/lora/service.js
 * @description Kohya-ss (Flux.1) 자동 학습 오케스트레이터 (최종 안정화 버전).
 */
const { withConnection } = require('../../../app/database');
const { storage } = require('../../../storage/oracle/blobStorage');
const { comfyui } = require('../../../services/comfyui/client');
const { logInfo, logError } = require('../../../app/logger');
const {
  LORA_TRAINING_STEPS, LORA_RANK, LORA_ALPHA, LORA_LEARNING_RATE,
  LORA_OPTIMIZER, LORA_OPTIMIZER_ARGS, LORA_GRADIENT_CHECKPOINTING,
  LORA_CACHE_LATENTS, LORA_CACHE_TEXT_ENCODER,
  LORA_BLOCKS_TO_SWAP, LORA_FP8_BASE,
  LORA_BATCH_SIZE, LORA_UNET_ONLY,
  LORA_MODEL_TRANSFORMER, LORA_MODEL_VAE, LORA_MODEL_CLIP_L, LORA_MODEL_T5,
} = require('../../../app/config');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REMOTE_KOHYA_ROOT = '/home/vllm/kohya_ss';
const REMOTE_SSH_CMD = 'ssh -p 2222 koreaf16@192.168.0.3';
const REMOTE_SCP_CMD = 'scp -P 2222';

const COMFY_MODELS_ROOT = '/home/vllm/comfy/models';
const FLUX_MODELS = {
  dit:   `${COMFY_MODELS_ROOT}/unet/${LORA_MODEL_TRANSFORMER}`,
  vae:   `${COMFY_MODELS_ROOT}/vae/${LORA_MODEL_VAE}`,
  clip_l: `${COMFY_MODELS_ROOT}/clip/${LORA_MODEL_CLIP_L}`,
  t5xxl: `${COMFY_MODELS_ROOT}/clip/${LORA_MODEL_T5}`,
};

const _activeJobs = new Map();

/**
 * 원격 서버의 잔여 학습 프로세스를 정리하여 VRAM을 확보한다.
 */
async function cleanupRemoteGpu() {
  logInfo('lora.cleanup', 'Cleaning up remote GPU processes...');
  try {
    const cmd = `${REMOTE_SSH_CMD} "pkill -9 -f flux_train_network.py || true; pkill -9 -f run_.*.sh || true; sleep 2"`;
    execSync(cmd, { timeout: 15000 });
  } catch (err) { /* ignore */ }
}

/**
 * 학습 중지 및 VRAM 정리
 */
async function stopRemoteTraining(assetId) {
  logInfo('lora.stop', `Stopping training for asset: ${assetId}`);
  try {
    await cleanupRemoteGpu();
    _activeJobs.delete(assetId);
    return { success: true };
  } catch (err) {
    logError('lora.stop.fail', err);
    throw err;
  }
}

async function prepareTrainingData(assetId, triggerWord = 'trigger') {
  const finalTrigger = 'trigger';
  const localTmpDir = path.join(os.tmpdir(), `lora_data_${assetId}`);
  const remoteDatasetDir = `${REMOTE_KOHYA_ROOT}/datasets/${assetId}`;
  const remoteImagesDir = `${remoteDatasetDir}/10_${finalTrigger}`;

  try {
    const images = await withConnection(async (conn) => {
      const res = await conn.execute(
        `SELECT d.image_id FROM asset_derived_images d
         JOIN system_files f ON d.image_id = f.file_id
         WHERE f.asset_id = :1 AND (d.is_passed = 1 OR d.is_passed IS NULL)`,
        [assetId]
      );
      return res.rows.map(r => r[0]);
    });

    if (images.length === 0) throw new Error('No images available for training.');

    if (fs.existsSync(localTmpDir)) fs.rmSync(localTmpDir, { recursive: true, force: true });
    fs.mkdirSync(localTmpDir, { recursive: true });

    for (let i = 0; i < images.length; i++) {
      const buffer = await storage.getImageBytes(images[i]);
      fs.writeFileSync(path.join(localTmpDir, `img_${i.toString().padStart(3, '0')}.png`), buffer);
    }

    execSync(`${REMOTE_SSH_CMD} "mkdir -p ${remoteImagesDir} ${remoteDatasetDir}/model"`);
    execSync(`${REMOTE_SCP_CMD} ${localTmpDir}/*.png koreaf16@192.168.0.3:${remoteImagesDir}/`);

    const tomlContent = `
[general]
enable_bucket = true
resolution = [768, 768]
batch_size = ${LORA_BATCH_SIZE}

[[datasets]]
  [[datasets.subsets]]
  image_dir = "${remoteImagesDir}"
  num_repeats = 10
    `.trim();
    
    fs.writeFileSync(path.join(localTmpDir, 'dataset.toml'), tomlContent);
    execSync(`${REMOTE_SCP_CMD} ${path.join(localTmpDir, 'dataset.toml')} koreaf16@192.168.0.3:${remoteDatasetDir}/dataset.toml`);

    return { remote_path: remoteDatasetDir, image_count: images.length, trigger_word: finalTrigger };
  } catch (err) {
    logError('lora.prepare', err);
    throw err;
  } finally {
    if (fs.existsSync(localTmpDir)) fs.rmSync(localTmpDir, { recursive: true, force: true });
  }
}

async function startRemoteTraining(assetId, triggerWord) {
  // ComfyUI에 로드된 모델(Kontext 등)을 VRAM에서 언로드 → Kohya 학습용 메모리 확보
  await comfyui.freeMemory();
  await cleanupRemoteGpu();

  const remoteDatasetDir = `${REMOTE_KOHYA_ROOT}/datasets/${assetId}`;
  const timestamp = Date.now();
  const loraName = `lora_${assetId}_${timestamp}`;
  const remoteScriptPath = `${remoteDatasetDir}/run_${timestamp}.sh`;
  const remoteLogPath = `${remoteDatasetDir}/training_${timestamp}.log`;
  const localTmpDir = path.join(os.tmpdir(), `lora_sh_${assetId}`);
  
  if (!fs.existsSync(localTmpDir)) fs.mkdirSync(localTmpDir, { recursive: true });

  // config.js의 서버별 튜닝 값 사용 (A100: rank 256, steps 1500, blocksToSwap 20 등)
  const cacheLatentsFlag = LORA_CACHE_LATENTS === 'disk'
    ? '--cache_latents --cache_latents_to_disk'
    : '--cache_latents';
  const cacheTextEncFlag = LORA_CACHE_TEXT_ENCODER === 'disk'
    ? '--cache_text_encoder_outputs --cache_text_encoder_outputs_to_disk'
    : '--cache_text_encoder_outputs';
  const blocksSwapFlag = LORA_BLOCKS_TO_SWAP > 0
    ? `--blocks_to_swap ${LORA_BLOCKS_TO_SWAP}`
    : '';
  const gradCkptFlag = LORA_GRADIENT_CHECKPOINTING ? '--gradient_checkpointing' : '';
  const fp8Flag = LORA_FP8_BASE ? '--fp8_base' : '';
  const unetOnlyFlag = LORA_UNET_ONLY ? '--network_train_unet_only' : '';
  const optimizerArgsFlag = LORA_OPTIMIZER_ARGS
    ? `--optimizer_args ${LORA_OPTIMIZER_ARGS.split(' ').map(a => `"${a}"`).join(' ')}`
    : '';

  // Flux LoRA 학습 커맨드 — 커뮤니티 최적 설정 (A100 40GB, ~15-20분, 최고 품질)
  // ref: https://civitai.com/articles/11112 (rank32, 캐릭터 sweet spot)
  //      https://docs.clore.ai/guides/training/kohya-training (lr 1e-4, cosine_with_restarts, warmup)
  //      https://discuss.huggingface.co/t/perfect-lora-training-parameters-human-character/147211
  const lrWarmupSteps = Math.round(LORA_TRAINING_STEPS * 0.1); // warmup = 전체 steps의 10%
  const pythonCmd = [
    'python flux_train_network.py',
    `--pretrained_model_name_or_path "${FLUX_MODELS.dit}"`,
    `--clip_l "${FLUX_MODELS.clip_l}"`,
    `--t5xxl "${FLUX_MODELS.t5xxl}"`,
    `--ae "${FLUX_MODELS.vae}"`,
    `--dataset_config "${remoteDatasetDir}/dataset.toml"`,
    `--output_dir "${remoteDatasetDir}/model"`,
    `--output_name "${loraName}"`,
    '--network_module networks.lora_flux',
    `--network_dim ${LORA_RANK}`,
    `--network_alpha ${LORA_ALPHA}`,
    `--max_train_steps ${LORA_TRAINING_STEPS}`,
    `--train_batch_size ${LORA_BATCH_SIZE}`,
    `--learning_rate ${LORA_LEARNING_RATE}`,
    `--optimizer_type ${LORA_OPTIMIZER}`,
    optimizerArgsFlag,
    '--lr_scheduler cosine_with_restarts', // clore.ai 권장: 수렴 안정성 cosine > constant
    `--lr_warmup_steps ${lrWarmupSteps}`,  // 10% warmup — cold start 방지 (clore.ai)
    '--mixed_precision bf16',
    '--save_model_as safetensors',
    '--sdpa',
    // sigmoid: kohya Flux 기본값, 가장 검증된 timestep 샘플링 (civitai/9360)
    '--timestep_sampling sigmoid',
    '--model_prediction_type raw',    // Flux flow-matching 필수: raw velocity 예측
    // apply_t5_attn_mask 제거: mask → PyTorch SDPA Flash Attention 비활성화 → O(seq²) 풀 어텐션 할당
    // batch4 × 24heads × 4685² × 2bytes = 4.24 GiB OOM 원인. 제거 시 FlashAttn O(seq) 사용
    '--t5xxl_max_token_length 512',   // 512: fp8_base 여유 VRAM 활용, 긴 캡션 품질 향상
    // fused_backward_pass: Adafactor 전용, AdamW8bit에서 사용 불가
    unetOnlyFlag,
    gradCkptFlag,
    fp8Flag,
    blocksSwapFlag,
    cacheLatentsFlag,
    cacheTextEncFlag,
  ].filter(Boolean).join(' ');

  const shContent = `#!/bin/bash
cd ${REMOTE_KOHYA_ROOT}/sd-scripts
source ../venv/bin/activate
export CUDA_VISIBLE_DEVICES=2
export PYTHONPATH=${REMOTE_KOHYA_ROOT}:${REMOTE_KOHYA_ROOT}/sd-scripts
export PYTHONIOENCODING=utf-8
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
echo "--- JOB START [${timestamp}] ---"
${pythonCmd}
echo "--- JOB FINISHED ---"
`.trim();

  const shPath = path.join(localTmpDir, `run_${timestamp}.sh`);
  fs.writeFileSync(shPath, shContent.replace(/\r\n/g, '\n'));

  try {
    execSync(`${REMOTE_SSH_CMD} "mkdir -p ${remoteDatasetDir}"`, { timeout: 10000 });
    execSync(`${REMOTE_SCP_CMD} ${shPath} koreaf16@192.168.0.3:${remoteScriptPath}`, { timeout: 20000 });
    
    const runCmd = `${REMOTE_SSH_CMD} "chmod +x ${remoteScriptPath} && nohup ${remoteScriptPath} > ${remoteLogPath} 2>&1 &"`;
    try {
      execSync(runCmd, { timeout: 15000 });
    } catch (e) {
      logInfo('lora.train.spawn', 'SSH command finished or timed out (expected for nohup)');
    }

    _activeJobs.set(assetId, { status: 'running', lora_name: loraName, log_path: remoteLogPath });
    return { status: 'started', lora_name: loraName, log_path: remoteLogPath };
  } catch (err) {
    logError('lora.train.fail', err);
    throw err;
  } finally {
    if (fs.existsSync(localTmpDir)) fs.rmSync(localTmpDir, { recursive: true, force: true });
  }
}

async function getTrainingStatus(assetId) {
  let job = _activeJobs.get(assetId);
  if (!job) {
    try {
      const lastLog = execSync(`${REMOTE_SSH_CMD} "ls -t ${REMOTE_KOHYA_ROOT}/datasets/${assetId}/training_*.log 2>/dev/null | head -n 1"`).toString().trim();
      if (lastLog) {
        const timestamp = lastLog.match(/training_(\d+)\.log/)?.[1];
        job = { log_path: lastLog, lora_name: timestamp ? `lora_${assetId}_${timestamp}` : null };
      }
    } catch (err) { /* ignore */ }
  }
  if (!job) return { log: 'Job not found.', status: 'idle' };
  try {
    const logTail = execSync(`${REMOTE_SSH_CMD} "tail -n 100 ${job.log_path}"`).toString();
    const isDone = logTail.includes('model saved') || logTail.includes('JOB FINISHED');
    return { log: logTail, status: isDone ? 'done' : 'running', lora_name: job.lora_name };
  } catch (err) { return { log: 'Log unavailable.', status: 'waiting' }; }
}

async function linkManualLora(assetId, loraFilename, triggerWord) {
  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE assets SET lora_path = :1, trigger_word = :2, visual_strategy = 'LORA', pipeline_status = 'LORA_TRAINED'
       WHERE asset_id = :3`,
      [loraFilename, triggerWord, assetId],
      { autoCommit: true }
    );
  });
  return { success: true };
}

module.exports = { prepareTrainingData, startRemoteTraining, stopRemoteTraining, getTrainingStatus, linkManualLora };
