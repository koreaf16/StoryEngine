/**
 * @file loraApi.js
 * @description Kohya-ss 기반 LoRA 학습 연동 API.
 */

/**
 * 필터링된 이미지들을 GPU 서버의 학습 폴더로 전송한다.
 */
export async function prepareLoraTraining(assetId, triggerWord) {
  const res = await fetch(`/api/visual/lora/${assetId}/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger_word: triggerWord })
  });
  if (!res.ok) throw new Error('학습 데이터 준비 실패');
  return res.json();
}

/**
 * 원격 서버에서 LoRA 학습을 시작한다.
 */
export async function startLoraTraining(assetId, triggerWord) {
  const res = await fetch(`/api/visual/lora/${assetId}/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger_word: triggerWord })
  });
  if (!res.ok) throw new Error('LoRA 학습 시작 실패');
  return res.json();
}

/**
 * 원격 서버의 LoRA 학습을 강제 중단한다.
 */
export async function stopLoraTraining(assetId) {
  const res = await fetch(`/api/visual/lora/${assetId}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error('LoRA 학습 중단 실패');
  return res.json();
}

/**
 * 원격 서버의 학습 로그 및 상태를 조회한다.
 */
export async function getLoraTrainingStatus(assetId) {
  const res = await fetch(`/api/visual/lora/${assetId}/status`);
  if (!res.ok) throw new Error('LoRA 상태 조회 실패');
  return res.json();
}

/**
 * 수동 학습된 LoRA 파일명과 트리거 워드를 에셋에 연결한다.
 */
export async function linkManualLora(assetId, loraFilename, triggerWord) {
  const res = await fetch(`/api/visual/lora/${assetId}/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lora_filename: loraFilename, trigger_word: triggerWord })
  });
  if (!res.ok) throw new Error('LoRA 연결 실패');
  return res.json();
}
