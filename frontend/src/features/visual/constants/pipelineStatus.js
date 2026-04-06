/**
 * @file pipelineStatus.js
 * @description Visual Factory 파이프라인 상태 enum 및 순서 정의.
 * @usage AssetSelectRow, useAnchorGeneration 등에서 상태 판별에 사용.
 * @connects store/useProjectStore.js (pipeline_status 필드)
 * @doc docs/04-visual-factory.md (파이프라인 상태)
 */

export const PIPELINE_STATUS = {
  NONE: 'NONE',
  ANCHOR_GENERATING: 'ANCHOR_GENERATING',
  ANCHOR_SELECTED: 'ANCHOR_SELECTED',
  DERIVED_GENERATING: 'DERIVED_GENERATING',
  DERIVED_FILTERED: 'DERIVED_FILTERED',
  LORA_TRAINING: 'LORA_TRAINING',
  LORA_TRAINED: 'LORA_TRAINED',
}

/** 파이프라인 진행 단계 순서 (숫자가 클수록 더 진행됨) */
export const PIPELINE_ORDER = {
  NONE: 0,
  ANCHOR_GENERATING: 1,
  ANCHOR_SELECTED: 2,
  DERIVED_GENERATING: 3,
  DERIVED_FILTERED: 4,
  LORA_TRAINING: 5,
  LORA_TRAINED: 6,
}
