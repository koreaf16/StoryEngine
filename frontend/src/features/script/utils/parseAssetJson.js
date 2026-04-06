/**
 * @file parseAssetJson.js
 * @description LLM 응답에서 에셋 JSON 배열을 파싱하고 기본 검증.
 * @usage PasteResponse(Pass 2)에서 LLM 응답을 에셋 배열로 변환 시 사용.
 * @connects features/script/constants/assetTypes.js
 * @doc docs/02-script-input.md (에셋 JSON 형식 + 스키마 검증)
 */
import { ASSET_TYPES, AUDIO_TYPES } from '../constants/assetTypes.js'

export default function parseAssetJson(rawText) {
  const jsonMatch = rawText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('JSON 배열을 찾을 수 없습니다. LLM 응답에 [ ... ] 형식의 JSON이 포함되어야 합니다.')
  }

  let parsed
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    throw new Error(`JSON 파싱 실패: ${e.message}`)
  }

  if (!Array.isArray(parsed)) {
    throw new Error('최상위 구조가 배열이 아닙니다.')
  }

  const validated = parsed.map((item, idx) => {
    if (!item.asset_id) throw new Error(`에셋 ${idx + 1}: asset_id가 없습니다.`)
    if (!item.display_name) throw new Error(`에셋 ${idx + 1}: display_name이 없습니다.`)
    if (!ASSET_TYPES.includes(item.asset_type)) {
      throw new Error(`에셋 ${idx + 1}: 잘못된 asset_type "${item.asset_type}"`)
    }
    if (!item.appearance_prompt || !item.appearance_prompt.trim()) {
      throw new Error(`에셋 ${idx + 1} (${item.display_name}): appearance_prompt가 없습니다. LLM에 재요청하세요.`)
    }

    return {
      asset_id: item.asset_id,
      asset_type: item.asset_type,
      display_name: item.display_name,
      appearance_prompt: item.appearance_prompt.trim(),
      outfit_prompt: item.outfit_prompt ? item.outfit_prompt.trim() : '',
      audio_type: AUDIO_TYPES.includes(item.audio_type) ? item.audio_type : 'NONE',
      voice_hint: item.voice_hint || '',
      visual_strategy: 'PROMPT',
      audio_identifier: '',
      is_protagonist: item.asset_type === 'CHARACTER' && item.is_protagonist === true,
    }
  })

  return validated
}
