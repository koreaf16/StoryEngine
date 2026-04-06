/**
 * @file assetTypes.js
 * @description 에셋 타입 목록과 오디오 타입 상수.
 * @usage AssetRow, AssetEditModal, parseAssetJson 등에서 유효성 검증 및 표시.
 * @connects shared/constants/colors.js (색상 매핑)
 * @doc docs/02-script-input.md (에셋 JSON 형식)
 */

export const ASSET_TYPES = ['CHARACTER', 'NPC', 'LOCATION', 'ITEM', 'MONSTER']

export const AUDIO_TYPES = ['TTS', 'SFX', 'NONE']
