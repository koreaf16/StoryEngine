/**
 * @file features/project/derivedImagePayloads.js
 * @description asset_derived_images 조회 결과를 프로젝트 상세 응답용 payload로 변환.
 * @usage features/project/router.js에서 프로젝트 상세 API 응답 조립 시 사용.
 * @connects features/visual/derived/presets.js
 * @doc docs/04-visual-factory.md
 */

const FILTERED_PIPELINE_STATUSES = new Set(['DERIVED_FILTERED', 'LORA_TRAINING', 'LORA_TRAINED']);
const SKIPPED_FILTER_ASSET_TYPES = new Set(['MONSTER', 'LOCATION', 'ITEM']);

function buildPresetIndex(presets) {
  const index = {};
  for (const [type, presetList] of Object.entries(presets)) {
    index[type] = {};
    presetList.forEach((preset, idx) => {
      index[type][preset.label] = { ...preset, _order: idx };
    });
  }
  return index;
}

function resolveFilterResult(assetType, pipelineStatus, skipSimilarity, isPassed) {
  if (!FILTERED_PIPELINE_STATUSES.has(pipelineStatus)) return null;
  if (SKIPPED_FILTER_ASSET_TYPES.has(assetType)) return 'SKIP';
  if (skipSimilarity) return 'SKIP';
  if (isPassed === null || isPassed === undefined) return null;
  return isPassed ? 'PASS' : 'FAIL';
}

function buildDerivedImagesPayload(derivedRows, assetType, pipelineStatus, presetIndex) {
  const typeIndex = presetIndex[assetType] || presetIndex.CHARACTER || {};
  const payload = derivedRows.map(([imageId, presetName, faceDistance, isPassed]) => {
    const presetInfo = typeIndex[presetName] || {};
    const skipSimilarity = SKIPPED_FILTER_ASSET_TYPES.has(assetType) || Boolean(presetInfo.skip_similarity);
    return {
      image_id: imageId,
      image_url: `/api/visual/images/${imageId}`,
      preset_name: presetName,
      preset_key: presetInfo.key || null,
      category: presetInfo.category || null,
      face_distance: faceDistance,
      passed: isPassed === null ? null : Boolean(isPassed),
      filter_result: resolveFilterResult(assetType, pipelineStatus, skipSimilarity, isPassed),
      skip_similarity: skipSimilarity,
      _order: presetInfo._order !== undefined ? presetInfo._order : 999,
    };
  });

  return payload.sort((a, b) => a._order - b._order)
    .map(({ _order, ...rest }) => rest);
}

module.exports = { buildPresetIndex, buildDerivedImagesPayload };
