/**
 * @file services/snapApi.js
 * @description 스냅 이미지 생성 API 호출 함수. SSE 스트리밍 및 단일 샷 생성 지원.
 * @usage features/episode/hooks/useSnapGeneration.js에서 사용.
 * @connects backend /api/projects/:id/episodes/:episodeId/snaps/*
 * @doc docs/05-episode.md (5. 스냅 이미지 생성)
 */

/**
 * 에피소드 내 스냅 미생성(또는 전체) 샷을 순서대로 생성하는 SSE 비동기 제너레이터.
 * anchorApi.js의 generateAnchorCandidatesStream 패턴과 동일.
 * @param {object} params
 * @param {string} params.projectId
 * @param {string} params.episodeId
 * @param {boolean} [params.force] - true일 경우 전체 재생성.
 * @param {AbortSignal} [params.signal]
 * @yields {{ type: 'init', total } | { scene_number, shot_number, snap_image_id, snap_image } | { type: 'error', scene_number, shot_number, message }}
 */
export async function* generateSnapsStream({ projectId, episodeId, force = false, signal }) {
  const res = await fetch(`/api/projects/${projectId}/episodes/${episodeId}/snaps/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force }),
    signal,
  });
  if (!res.ok) throw new Error(`스냅 생성 실패: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        const payload = JSON.parse(raw);
        if (payload.done) return;
        yield payload;
      }
      if (done) {
        if (buffer.startsWith('data: ')) {
          const raw = buffer.slice(6).trim();
          if (raw) {
            const payload = JSON.parse(raw);
            if (!payload.done) yield payload;
          }
        }
        break;
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

/**
 * 단일 샷의 스냅을 생성(또는 재생성)한다.
 * @returns {Promise<{ scene_number, shot_number, snap_image_id, snap_image }>}
 */
export async function generateShotSnap(projectId, episodeId, sceneNumber, shotNumber) {
  const res = await fetch(
    `/api/projects/${projectId}/episodes/${episodeId}/snaps/${sceneNumber}/${shotNumber}`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`스냅 재생성 실패: ${res.status}`);
  return res.json();
}
