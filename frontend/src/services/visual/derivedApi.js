/**
 * @file derivedApi.js
 * @description 파생 이미지 생성/필터링 API 호출 함수.
 * @usage useDerivedGeneration.js 훅에서 사용.
 * @connects backend /api/visual/derived/*
 * @doc docs/04-visual-factory.md (파생 이미지 생성)
 */

/**
 * 백엔드 이미지 응답 필드를 프론트엔드 표준으로 정규화.
 * preset_label → preset_name, filter_result(PASS/FAIL/SKIP)
 */
function normalizeImage(img) {
  const resolvedFilterResult = img.filter_result
    || (img.passed === true ? 'PASS' : undefined)
    || (img.passed === false ? 'FAIL' : undefined)

  return {
    ...img,
    preset_name: img.preset_name || img.preset_label,
    // filter_result는 이미 백엔드에서 PASS/FAIL/SKIP으로 올 수도 있음
    filter_result: resolvedFilterResult,
  }
}

/**
 * Kontext로 파생 이미지를 SSE 스트리밍으로 하나씩 받아오는 비동기 제너레이터.
 * 이미지가 완성될 때마다 yield — 앵커 생성과 동일한 패턴.
 *
 * 이벤트 순서:
 *   1. {started: true, total: N} — 전체 프리셋 수 (total로 yield)
 *   2. {image JSON}              — 이미지 하나씩 (normalizeImage 후 yield)
 *   3. {done: true}              — 종료
 *
 * @param {AbortSignal} [signal] - fetch AbortController 시그널 (선택)
 * @yields {{type: 'total', total: number} | {type: 'image', ...imageFields}}
 */
export async function* generateDerivedStream({ projectId, assetId, assetType, anchorImageId, appearancePrompt, targetPresets, signal }) {
  const res = await fetch('/api/visual/derived/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      asset_id: assetId,
      asset_type: assetType,
      anchor_image_id: anchorImageId,
      appearance_prompt: appearancePrompt,
      target_presets: targetPresets,
    }),
    signal,
  })
  if (!res.ok) throw new Error(`파생 생성 실패: ${res.status}`)

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
        if (payload.started) {
          yield { type: 'total', total: payload.total }
        } else {
          yield { type: 'image', ...normalizeImage(payload) }
        }
      }
      if (done) {
        if (buffer.startsWith('data: ')) {
          const raw = buffer.slice(6).trim()
          if (raw) {
            const payload = JSON.parse(raw)
            if (!payload.done) {
              if (payload.started) {
                yield { type: 'total', total: payload.total }
              } else {
                yield { type: 'image', ...normalizeImage(payload) }
              }
            }
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
 * 앵커 임베딩으로 얼굴 거리 필터링.
 * @returns {Promise<{passed_count, failed_count, skipped_count, images: Array}>}
 */
export async function filterDerived({ projectId, assetId, assetType, anchorEmbedding, images }) {
  const res = await fetch('/api/visual/derived/filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      asset_id: assetId,
      asset_type: assetType,
      anchor_embedding: anchorEmbedding,
      images: images.map((img) => ({
        image_id: img.image_id,
        preset_key: img.preset_key,
        preset_name: img.preset_name,
        category: img.category,
        image_url: img.image_url,
        skip_similarity: img.skip_similarity ?? false,
      })),
    }),
  })
  if (!res.ok) throw new Error(`필터링 실패: ${res.status}`)
  const data = await res.json()
  return { ...data, images: data.images.map(normalizeImage) }
}
