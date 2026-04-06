/**
 * @file buildPromptB.js
 * @description 세계관 뼈대 + 원본 입력으로 프롬프트 B(에셋 JSON 추출) 조립.
 * @usage PromptBPage에서 프롬프트 텍스트 생성 시 호출.
 * @connects features/script/constants/promptTemplates.js
 * @doc docs/02-script-input.md (Pass 2: 에셋 JSON 추출)
 */
import { PROMPT_B_TEMPLATE } from '../constants/promptBTemplate.js'

function stringifyBlock(value, emptyLabel) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || emptyLabel
  }

  if (value) {
    return JSON.stringify(value, null, 2)
  }

  return emptyLabel
}

export default function buildPromptB(worldBackbone, userInput) {
  const backboneStr = stringifyBlock(worldBackbone, '(Prompt A world backbone is empty)')
  const inputStr = stringifyBlock(userInput, '(Original user seed is empty)')

  return PROMPT_B_TEMPLATE
    .replace('{{worldBackbone}}', backboneStr)
    .replace('{{userInput}}', inputStr)
}
