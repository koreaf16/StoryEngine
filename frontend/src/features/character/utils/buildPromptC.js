/**
 * @file buildPromptC.js
 * @description 캐릭터 프로필 생성용 프롬프트 C를 조립하는 유틸리티.
 * @usage CharacterPromptPage.jsx의 LLM 탭에서 PromptCopyPaste에 전달.
 * @connects features/character/constants/promptTemplates.js, shared/constants/badgeConfig.js
 * @doc docs/03-character-setup.md (방식 A: LLM 협업 생성)
 */
import { PROMPT_C_TEMPLATE } from '../constants/promptTemplates.js'
import { ASSET_TYPE_LABELS } from '../../../shared/constants/badgeConfig.js'

export default function buildPromptC(asset, worldBackbone) {
  return PROMPT_C_TEMPLATE
    .replace(/\{\{characterName\}\}/g, asset.display_name)
    .replace('{{assetType}}', ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type)
    .replace('{{voiceHint}}', asset.voice_hint || '(미설정)')
    .replace('{{appearancePrompt}}', asset.appearance_prompt || '(미설정)')
    .replace('{{worldBackbone}}', worldBackbone || '(세계관 미설정)')
}
