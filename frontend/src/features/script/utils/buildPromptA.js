/**
 * @file buildPromptA.js
 * @description 사용자 씨앗 입력으로 프롬프트 A(세계관 뼈대 생성) 조립.
 * @usage PromptAPage에서 프롬프트 텍스트 생성 시 호출.
 * @connects features/script/constants/promptTemplates.js
 * @doc docs/02-script-input.md (Pass 1: 세계관 뼈대 생성)
 */
import { PROMPT_A_TEMPLATE } from '../constants/promptTemplates.js'

export default function buildPromptA(userInput) {
  const inputStr = typeof userInput === 'string' ? userInput : (userInput ? JSON.stringify(userInput, null, 2) : '')
  return PROMPT_A_TEMPLATE.replace('{{userInput}}', inputStr)
}
