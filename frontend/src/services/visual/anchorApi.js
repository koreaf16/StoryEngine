/**
 * @file anchorApi.js
 * @description 앵커 이미지 생성/확정 API 호출 함수.
 * @usage useAnchorGeneration.js 훅에서 사용.
 * @connects backend /api/visual/anchor/*
 * @doc docs/04-visual-factory.md (앵커 선택)
 */

/**
 * Flux Dev로 앵커 후보 이미지를 SSE 스트리밍으로 하나씩 받아오는 비동기 제너레이터.
 * 완료된 후보부터 순서대로 yield. 마지막 이벤트 done:true에서 종료.
 * @param {AbortSignal} [signal] - fetch AbortController 시그널 (선택)
 * @yields {{index, image_id, grade, url, image_url}}
 */
export async function* generateAnchorCandidatesStream({ projectId, assetId, assetType, appearancePrompt, count = 8, visualStyle = 'PHOTOREALISTIC', signal }) {
  const res = await fetch('/api/visual/anchor/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      asset_id: assetId,
      asset_type: assetType,
      appearance_prompt: appearancePrompt,
      count,
      visual_style: visualStyle,
    }),
    signal,
  })
  if (!res.ok) throw new Error(`앵커 생성 실패: ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (value) {
        buffer += decoder.decode(value, { stream: true })
      }
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue
        const payload = JSON.parse(raw)
        if (payload.done) return
        yield payload
      }
      if (done) {
        if (buffer.startsWith('data: ')) {
          const raw = buffer.slice(6).trim()
          if (raw) {
            const payload = JSON.parse(raw)
            if (!payload.done) yield payload
          }
        }
        break
      }
    }
  } finally {
    reader.cancel().catch(() => {})
  }
}

/**
 * PuLID + Flux Dev로 참조 사진 기반 앵커 후보 이미지를 SSE 스트리밍으로 받아오는 비동기 제너레이터.
 * @param {File} file - 참조 사진 파일
 * @yields {{index, image_id, grade, url, image_url}}
 */
export async function* generatePulidAnchorCandidatesStream({ projectId, assetId, assetType, appearancePrompt, file, count = 5, weight = 0.85, visualStyle = 'PHOTOREALISTIC', signal }) {
  const formData = new FormData()
  formData.append('project_id', projectId)
  formData.append('asset_id', assetId)
  formData.append('asset_type', assetType)
  formData.append('appearance_prompt', appearancePrompt || '')
  formData.append('count', count)
  formData.append('weight', weight)
  formData.append('visual_style', visualStyle)
  formData.append('file', file)

  const res = await fetch('/api/visual/anchor/generate-pulid', {
    method: 'POST',
    body: formData,
    signal,
  })
  if (!res.ok) throw new Error(`PuLID 앵커 생성 실패: ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (value) {
        buffer += decoder.decode(value, { stream: true })
      }
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue
        const payload = JSON.parse(raw)
        if (payload.done) return
        yield payload
      }
      if (done) {
        if (buffer.startsWith('data: ')) {
          const raw = buffer.slice(6).trim()
          if (raw) {
            const payload = JSON.parse(raw)
            if (!payload.done) yield payload
          }
        }
        break
      }
    }
  } finally {
    reader.cancel().catch(() => {})
  }
}

/**
 * 앵커 이미지 확정 + 얼굴 임베딩 추출.
 * @returns {Promise<{image_id, grade, face_bbox, embedding, image_url}>}
 */
export async function confirmAnchor({ projectId, assetId, candidateImageId }) {
  const res = await fetch('/api/visual/anchor/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      asset_id: assetId,
      candidate_image_id: candidateImageId,
    }),
  })
  if (!res.ok) throw new Error(`앵커 확정 실패: ${res.status}`)
  const data = await res.json()
  return data
}

/**
 * 앵커 후보 이미지 업로드.
 * @returns {Promise<{index, image_id, grade, url, image_url}>}
 */
export async function uploadAnchorCandidate({ projectId, assetId, file, index }) {
  const formData = new FormData()
  formData.append('project_id', projectId)
  formData.append('asset_id', assetId)
  formData.append('index', index)
  formData.append('file', file)

  const res = await fetch('/api/visual/anchor/upload', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`앵커 업로드 실패: ${res.status}`)
  const data = await res.json()
  return data
}
