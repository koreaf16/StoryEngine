/**
 * @file features/visual/lora/service.js
 * @description LoRA 학습 트리거 및 상태 관리 비즈니스 로직. ComfyUI-FluxTrainer(Flux 2)로 실제 학습 실행.
 * @usage features/visual/lora/router.js에서 호출.
 * @connects services/comfyui/client.js, services/comfyui/workflows/fluxLoraTraining.js, storage/oracle/blobStorage.js
 * @doc docs/04-visual-factory.md
 */
const { v4: uuidv4 } = require('uuid');
const { comfyui } = require('../../../services/comfyui/client');
const { tracker } = require('../../../services/comfyui/wsListener');
const { buildFluxLoraTraining } = require('../../../services/comfyui/workflows/fluxLoraTraining');
const { storage } = require('../../../storage/oracle/blobStorage');
const { withConnection } = require('../../../app/database');
const path = require('path');
const { LORA_TRAINING_STEPS, LORA_RANK, LORA_ALPHA, LORA_LEARNING_RATE, LORA_SUBFOLDER, LORA_OPTIMIZER, COMFYUI_INPUT_DIR } = require('../../../app/config');
const { logError, logInfo, logWarn } = require('../../../app/logger');

// 메모리 내 작업 상태 저장 (향후 DB 전환)
const _tasks = {};

function sanitizeTrigger(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() + '_char';
}

async function markLoraTraining(assetId) {
  await withConnection(async (conn) => {
    await conn.execute(
      "UPDATE assets SET pipeline_status = 'LORA_TRAINING' WHERE asset_id = :1",
      [assetId],
      { autoCommit: true }
    );
  });
}

async function markLoraTrained(assetId, triggerWord, loraPath) {
  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE assets
       SET trigger_word = :1, lora_path = :2, visual_strategy = 'LORA', pipeline_status = 'LORA_TRAINED'
       WHERE asset_id = :3`,
      [triggerWord, loraPath, assetId],
      { autoCommit: true }
    );
  });
}

async function markLoraFailed(assetId) {
  await withConnection(async (conn) => {
    await conn.execute(
      "UPDATE assets SET pipeline_status = 'DERIVED_FILTERED' WHERE asset_id = :1",
      [assetId],
      { autoCommit: true }
    );
  });
}

const axios = require('axios');

/**
 * pollResult 대체: task.cancelled 시 즉시 탈출. ComfyUI history를 직접 폴링한다.
 */
async function _pollWithCancel(task, promptId, interval, maxWait) {
  const deadline = Date.now() + maxWait;
  while (Date.now() < deadline) {
    if (task.cancelled) return null;
    try {
      const resp = await axios.get(`${comfyui.baseUrl}/history/${promptId}`, { timeout: 10000 });
      if (resp.data[promptId]) return resp.data[promptId];
    } catch { /* 일시적 오류 무시, 재시도 */ }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`LoRA training did not complete in ${maxWait / 1000}s`);
}

async function startLoraTraining(projectId, assetId, assetName, passedImageIds) {
  // ── 0. 이미 진행 중인 작업 확인 ──
  const existingTaskId = Object.keys(_tasks).find(
    (id) => _tasks[id].assetId === assetId && ['queued', 'uploading', 'training', 'saving'].includes(_tasks[id].status)
  );

  if (existingTaskId) {
    logInfo('lora.start', 'Returning existing task for assetId', { assetId, taskId: existingTaskId });
    return { task_id: existingTaskId, ..._tasks[existingTaskId] };
  }

  const taskId = uuidv4();
  const triggerWord = sanitizeTrigger(assetId);
  // ComfyUI loras 폴더 기준 상대경로로 저장 (LoraLoader 경로와 동일하게 유지)
  const loraBasename = `${assetId}_v1.safetensors`;
  const loraFilename = LORA_SUBFOLDER ? `${LORA_SUBFOLDER}\\${loraBasename}` : loraBasename;
  const loraTrainName = loraBasename.replace('.safetensors', '');
  // ComfyUI input 하위 폴더: FluxTrainer에는 절대경로로 전달
  const imageSubfolder = `lora_${assetId}`;
  const datasetSubfolder = path.join(COMFYUI_INPUT_DIR, imageSubfolder).replace(/\\/g, '/');

  _tasks[taskId] = {
    projectId,
    assetId,
    status: 'queued',
    progress: 0.0,
    stepValue: 0,
    stepMax: 0,
    triggerWord,
    loraFilename,
    loraTrainName,
    loraPath: null,
    passedImageIds,
    imageCount: passedImageIds.length,
    imageSubfolder,
    datasetSubfolder,
    error: null,
    cancelled: false,
  };

  await markLoraTraining(assetId);

  // 백그라운드에서 학습 실행 (이 함수는 즉시 반환됨)
  _runTraining(taskId).catch((err) => {
    if (_tasks[taskId]?.cancelled) return;
    logError('lora.runTraining', err, { taskId });
    if (_tasks[taskId]) {
      _tasks[taskId].status = 'error';
      _tasks[taskId].error = err.message;
      markLoraFailed(_tasks[taskId].assetId).catch((dbErr) =>
        logError('lora.markFailed', dbErr, { taskId })
      );
    }
  });

  return { task_id: taskId, ..._tasks[taskId] };
}

async function _runTraining(taskId) {
  const task = _tasks[taskId];
  const loraName = task.loraTrainName;

  // ── 0. VRAM 초기화 (플로우 전환 — 기존 로드 모델 언로드) ──
  logInfo('lora.freeMemory', 'Freeing GPU memory before LoRA training', { taskId });
  await comfyui.freeMemory();

  // ── 1. 학습 이미지를 ComfyUI에 업로드 ──
  task.status = 'uploading';
  logInfo('lora.upload', 'Uploading training images to ComfyUI', {
    taskId, imageCount: task.imageCount,
  });

  for (let i = 0; i < task.passedImageIds.length; i++) {
    const imageBytes = await storage.getImageBytes(task.passedImageIds[i]);
    if (!imageBytes) throw new Error(`Image ${task.passedImageIds[i]} not found`);
    const filename = `lora_train_${task.assetId}_${i}.png`;
    // ComfyUI input/{imageSubfolder}/ 하위에 업로드 → dataset_path 로 참조
    await comfyui.uploadImage(imageBytes, filename, task.imageSubfolder);
  }

  // ── 2. 학습 워크플로우 빌드 ──
  const workflow = buildFluxLoraTraining([], task.triggerWord, loraName, {
    steps: LORA_TRAINING_STEPS,
    rank: LORA_RANK,
    alpha: LORA_ALPHA,
    learningRate: LORA_LEARNING_RATE,
    optimizer: LORA_OPTIMIZER,
    datasetSubfolder: task.datasetSubfolder,
    imageCount: task.imageCount,
    outputDir: 'output',
  });

  // ── 3. ComfyUI 큐에 제출 ──
  task.status = 'training';
  task.progress = 0;
  logInfo('lora.queue', 'Queuing training workflow', {
    taskId, loraName, steps: LORA_TRAINING_STEPS,
  });
  const promptId = await comfyui.queuePrompt(workflow);
  task.promptId = promptId;

  // ── 4. WebSocket 트래커로 진행률 업데이트 ──
  const progressInterval = setInterval(() => {
    const p = tracker.getProgress();
    if (p.max > 0) {
      task.progress = Math.min(p.value / p.max, 0.99);
      task.stepValue = p.value;
      task.stepMax = p.max;
    }
  }, 1000);

  const steps = task.stepMax || LORA_TRAINING_STEPS;

  try {
    // 학습 대기: cancelled 체크 포함 폴링
    const maxWait = Math.max(steps * 3000, 3600000);
    const history = await _pollWithCancel(task, promptId, 5000, maxWait);

    // 사용자 취소 확인
    if (task.cancelled) return;

    // ComfyUI 실행 오류 감지
    const statusStr = history.status?.status_str;
    if (statusStr === 'error') {
      const msgs = (history.status?.messages || [])
        .filter((m) => m[0] === 'execution_error')
        .map((m) => m[1]?.exception_message || m[1]?.message || 'unknown')
        .join('; ');
      throw new Error(`ComfyUI training execution failed: ${msgs || 'unknown error'}`);
    }

    // ── 5. 학습된 LoRA 파일 다운로드 ──
    task.status = 'saving';
    task.progress = 0.99;

    logInfo('lora.history', 'ComfyUI history outputs for download', {
      taskId, loraName, outputs: JSON.stringify(history.outputs),
    });

    const loraBuffer = await _downloadLoraFile(loraName, history, promptId, steps);

    // ── 6. Oracle BLOB 저장 ──
    const loraId = await storage.saveLora(
      task.projectId, task.assetId, loraBuffer, task.loraFilename
    );
    logInfo('lora.saved', 'LoRA model saved to storage', {
      taskId, loraId, size: loraBuffer.length,
    });

    // ── 7. DB 갱신 ──
    await markLoraTrained(task.assetId, task.triggerWord, loraId);
    task.loraPath = loraId;
    task.status = 'done';
    task.progress = 1.0;

    logInfo('lora.complete', 'LoRA training completed', {
      taskId, assetId: task.assetId, triggerWord: task.triggerWord, loraId,
    });
  } finally {
    clearInterval(progressInterval);
  }
}

/**
 * ComfyUI output 디렉토리에서 학습된 LoRA 파일을 다운로드한다.
 * SaveLoRA 노드는 RETURN_TYPES=()이라 history.outputs에 기록되지 않으므로
 * WebSocket executed 이벤트에서 캡처한 실제 파일명을 우선 사용한다.
 */
/**
 * 절대경로에서 파일명만 추출 (크로스플랫폼)
 */
function _extractBasename(filePath) {
  return filePath.replace(/\\/g, '/').split('/').pop();
}

async function _downloadLoraFile(loraName, history, promptId, actualSteps = LORA_TRAINING_STEPS) {
  // 시도 1: history의 FluxTrainEnd 출력에서 lora_path STRING 추출
  const outputs = history.outputs || {};
  for (const nodeOutput of Object.values(outputs)) {
    // FluxTrainEnd는 lora_name / metadata / lora_path 를 text 배열 또는 개별 키로 저장
    const candidates = [
      ...(Array.isArray(nodeOutput.lora_path) ? nodeOutput.lora_path : []),
      ...(Array.isArray(nodeOutput.text) ? nodeOutput.text : []),
      ...(Array.isArray(nodeOutput.files) ? nodeOutput.files : []),
    ];
    for (const item of candidates) {
      const val = typeof item === 'string' ? item : item?.filename;
      if (!val || !val.endsWith('.safetensors')) continue;
      const basename = _extractBasename(val);
      logInfo('lora.download', 'Trying lora_path from FluxTrainEnd history', { val, basename });
      // FluxTrainEnd 출력은 output 폴더 또는 절대경로 → output 폴더에서 시도
      for (const subfolder of ['', loraName]) {
        try {
          const buf = await comfyui.downloadImage(basename, subfolder, 'output');
          logInfo('lora.download', 'Downloaded from output folder', { basename, subfolder });
          return buf;
        } catch { /* 다음 시도 */ }
      }
    }
  }

  // 시도 2: WebSocket executed 이벤트에서 캡처한 실제 파일명 사용
  if (promptId) {
    const executedOutputs = tracker.getExecutedOutputs(promptId);
    tracker.clearExecutedOutputs(promptId);
    for (const output of Object.values(executedOutputs)) {
      for (const key of ['text', 'files', 'images', 'lora_path']) {
        const items = output[key];
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          const name = typeof item === 'string' ? item : item?.filename;
          if (!name || !name.endsWith('.safetensors')) continue;
          const basename = _extractBasename(name);
          logInfo('lora.download', 'Using filename from WS executed event', { basename });
          try {
            return await comfyui.downloadImage(basename, item?.subfolder || '', item?.type || 'output');
          } catch { /* fallthrough */ }
        }
      }
    }
  }

  // 시도 3: FluxTrainer 출력 파일명 패턴 스캔 (output 폴더 기준)
  logWarn('lora.download', 'Falling back to pattern scan', { loraName, actualSteps });

  const knownPatterns = [
    // FluxTrainer 기본: {prefix}-{epoch:06d}.safetensors
    `${loraName}-000001.safetensors`,
    // {prefix}_{steps}.safetensors
    `${loraName}_${actualSteps}.safetensors`,
    // {prefix}_{steps:06d}.safetensors
    `${loraName}_${String(actualSteps).padStart(6, '0')}.safetensors`,
    // 고정 파일명
    `${loraName}.safetensors`,
  ];

  for (const filename of knownPatterns) {
    try {
      const buf = await comfyui.downloadImage(filename, '', 'output');
      logInfo('lora.download', 'Found LoRA file by pattern scan', { filename });
      return buf;
    } catch { /* 404 무시 */ }
  }

  throw new Error(`Trained LoRA file not found for ${loraName}. FluxTrainEnd 출력을 확인하세요.`);
}

/**
 * 개발용: ComfyUI 없이 더미 LoRA 버퍼를 DB에 직접 저장하고 assets 상태를 갱신한다.
 */
async function mockRegisterLora(projectId, assetId) {
  const assetName = `mock_${assetId}`;
  const triggerWord = sanitizeTrigger(assetName);
  const loraFilename = `${triggerWord}_mock.safetensors`;

  // 최소 더미 버퍼 (8바이트 — safetensors magic header 흉내)
  const dummyBuffer = Buffer.from([0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

  const loraId = await storage.saveLora(projectId, assetId, dummyBuffer, loraFilename);
  logInfo('lora.mockRegister', 'Dummy LoRA saved to DB', { loraId, assetId, loraFilename });

  await markLoraTrained(assetId, triggerWord, loraId);
  logInfo('lora.mockRegister', 'assets.pipeline_status → LORA_TRAINED', { assetId, triggerWord, loraId });

  return { lora_id: loraId, trigger_word: triggerWord, lora_filename: loraFilename, status: 'LORA_TRAINED' };
}

/**
 * 에셋의 LoRA를 삭제하고 파이프라인 상태를 DERIVED_FILTERED로 되돌린다.
 * 진행 중인 학습이 있으면 먼저 취소한다.
 */
async function deleteLoraAsset(assetId) {
  // 1. 진행 중인 작업 취소
  const runningTaskId = Object.keys(_tasks).find(
    (id) => _tasks[id].assetId === assetId && !['done', 'error', 'cancelled'].includes(_tasks[id].status)
  );
  if (runningTaskId) {
    cancelLoraTraining(runningTaskId);
  }

  // 2. DB에서 lora_path 조회
  const loraFileId = await withConnection(async (conn) => {
    const res = await conn.execute(
      'SELECT lora_path FROM assets WHERE asset_id = :1',
      [assetId]
    );
    return res.rows[0]?.[0] || null;
  });

  // 3. system_files에서 LoRA 파일 삭제 + 캐시 제거
  if (loraFileId) {
    await storage.deleteLora(loraFileId);
    logInfo('lora.delete', 'LoRA file deleted from storage', { assetId, loraFileId });
  }

  // 4. 에셋 상태 초기화 (DERIVED_FILTERED → 파생 이미지 선택 단계로 복귀)
  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE assets
       SET lora_path = NULL, trigger_word = NULL,
           visual_strategy = 'PROMPT', pipeline_status = 'DERIVED_FILTERED'
       WHERE asset_id = :1`,
      [assetId],
      { autoCommit: true }
    );
  });

  logInfo('lora.delete', 'Asset reset to DERIVED_FILTERED', { assetId });
  return { status: 'reset', asset_id: assetId };
}

function cancelLoraTraining(taskId) {
  const task = _tasks[taskId];
  if (!task) return null;
  if (task.status === 'done' || task.status === 'error' || task.status === 'cancelled') {
    return { task_id: taskId, status: task.status, message: 'Task already finished' };
  }
  task.cancelled = true;
  task.status = 'cancelled';
  task.error = 'User cancelled training';

  // ComfyUI interrupt를 반복 전송 (training loop가 즉시 반응하지 않을 수 있음)
  const sendInterrupt = async () => {
    for (let i = 0; i < 3; i++) {
      await comfyui.interrupt();
      await new Promise((r) => setTimeout(r, 1000));
    }
  };
  sendInterrupt().catch((err) => logError('lora.cancel.interrupt', err, { taskId }));

  markLoraFailed(task.assetId).catch((err) => logError('lora.cancel.markFailed', err, { taskId }));
  logInfo('lora.cancel', 'LoRA training cancelled by user', { taskId, assetId: task.assetId });
  return { task_id: taskId, status: 'cancelled' };
}

function getTaskByAssetId(assetId) {
  const taskId = Object.keys(_tasks).find(
    (id) => _tasks[id].assetId === assetId && !['done', 'error', 'cancelled'].includes(_tasks[id].status)
  );
  if (!taskId) return null;
  return getLoraStatus(taskId);
}

function getLoraStatus(taskId) {
  const task = _tasks[taskId];
  if (!task) return null;
  return { task_id: taskId, ...task };
}

module.exports = { startLoraTraining, getLoraStatus, cancelLoraTraining, deleteLoraAsset, getTaskByAssetId, mockRegisterLora };
