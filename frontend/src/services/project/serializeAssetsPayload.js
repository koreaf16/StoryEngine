/**
 * @file serializeAssetsPayload.js
 * @description 프론트 자산 상태를 backend `/api/projects/:id/assets` payload 형식으로 정규화한다.
 * @usage services/projectApi.js 에서 updateAssets 호출 직전에 사용.
 * @connects store/useProjectStore.js, backend/features/project/router.py
 * @doc docs/01-project.md, docs/07-asset-lifecycle.md
 */

function serializeAnchorEmbedding(anchorEmbedding) {
  if (Array.isArray(anchorEmbedding)) {
    return JSON.stringify(anchorEmbedding)
  }

  return typeof anchorEmbedding === 'string' ? anchorEmbedding : null
}

function serializeAsset(asset) {
  return {
    asset_id: asset.asset_id,
    asset_type: asset.asset_type,
    display_name: asset.display_name,
    appearance_prompt: asset.appearance_prompt ?? '',
    visual_strategy: asset.visual_strategy ?? 'PROMPT',
    audio_type: asset.audio_type ?? 'NONE',
    voice_hint: asset.voice_hint ?? '',
    pipeline_status: asset.pipeline_status ?? 'NONE',
    anchor_image_id: asset.anchor_image_id ?? asset.anchor_image?.image_id ?? null,
    anchor_embedding: serializeAnchorEmbedding(asset.anchor_embedding),
    lora_path: asset.lora_path ?? asset.lora_result?.lora_path ?? null,
    trigger_word: asset.trigger_word ?? asset.lora_result?.trigger_word ?? null,
    is_protagonist: asset.is_protagonist === true,
    outfit_prompt: asset.outfit_prompt ?? null,
    outfit_anchor_id: asset.outfit_anchor_id ?? null,
  }
}

export default function serializeAssetsPayload(assets = []) {
  return assets.map(serializeAsset)
}
