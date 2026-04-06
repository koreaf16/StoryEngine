/**
 * @file loraApi.js
 * @description LoRA 학습 시작/상태 조회 API 호출 함수.
 * @usage LoraCompletePage에서 사용.
 * @connects backend /api/visual/lora/*
 * @doc docs/04-visual-factory.md (LoRA 학습)
 */

/**
 * LoRA 학습 시작. task_id 즉시 반환.
 * @returns {Promise<{task_id, status, trigger_word, lora_filename, training_image_count}>}
 */
export async function startLoraTraining({ projectId, assetId, assetName, passedImageIds }) {
  const res = await fetch('/api/visual/lora/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      asset_id: assetId,
      asset_name: assetName,
      passed_image_ids: passedImageIds,
    }),
  })
  if (!res.ok) throw new Error(`LoRA 학습 시작 실패: ${res.status}`)
  return res.json()
}

/**
 * LoRA 학습 진행 상태 조회.
 * @returns {Promise<{task_id, status, progress, step_value, step_max, trigger_word, lora_filename, lora_path}>}
 */
export async function getLoraStatus(taskId) {
  const res = await fetch(`/api/visual/lora/status/${taskId}`)
  if (!res.ok) throw new Error(`상태 조회 실패: ${res.status}`)
  return res.json()
}

/**
 * LoRA 학습 중지.
 * @returns {Promise<{task_id, status}>}
 */
export async function cancelLoraTraining(taskId) {
  const res = await fetch(`/api/visual/lora/cancel/${taskId}`, { method: 'POST' })
  if (!res.ok) throw new Error(`학습 중지 실패: ${res.status}`)
  return res.json()
}

/**
 * LoRA 파일 삭제 + 에셋 상태를 DERIVED_FILTERED로 초기화.
 * @returns {Promise<{status, asset_id}>}
 */
export async function deleteLoRA(assetId) {
  const res = await fetch(`/api/visual/lora/${assetId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`LoRA 삭제 실패: ${res.status}`)
  return res.json()
}
