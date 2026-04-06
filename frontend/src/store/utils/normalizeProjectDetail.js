/**
 * @file normalizeProjectDetail.js
 * @description Backend project detail payload를 프론트에서 안전하게 쓰도록 정규화한다.
 * @usage useProjectStore.js에서 프로젝트 상세 조회 응답 저장 전에 호출.
 * @connects useProjectStore.js, services/projectApi.js
 * @doc docs/01-project.md
 */
export default function normalizeProjectDetail(detail = {}) {
  return {
    ...detail,
    seed: detail.seed ?? '',
    assets: Array.isArray(detail.assets) ? detail.assets : [],
    episodes: Array.isArray(detail.episodes) ? detail.episodes : [],
    storyCompass: detail.storyCompass ?? null,
    worldBackbone: detail.worldBackbone ?? '',
  }
}
