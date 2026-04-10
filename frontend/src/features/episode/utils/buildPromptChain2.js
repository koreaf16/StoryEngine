/**
 * @file buildPromptChain2.js
 * @description Chain 2 씬·샷 설계 프롬프트 조립. 소설 텍스트 + 에셋 목록 주입.
 * @usage ChainDesignPage(useChainDesign)에서 호출.
 * @connects features/episode/constants/promptTemplateChain2.js
 * @doc docs/05-episode.md (Chain 2: 씬·샷 설계)
 */
import { PROMPT_CHAIN2_TEMPLATE } from '../constants/promptTemplateChain2.js'

export default function buildPromptChain2({ episodeNumber, novelText, assets, demoMode = true }) {
  const assetList = (assets || [])
    .map((a) => {
      const loraTag = a.trigger_word ? ` [LoRA: ${a.trigger_word}]` : ''
      return `- ${a.asset_id} (${a.display_name}, ${a.asset_type}${loraTag})`
    })
    .join('\n')

  const demoInstruction = demoMode
    ? '[데모 모드] 씬은 정확히 1개만 생성하라. 단, 그 씬의 샷은 충분히 생성하라 (8~15개). 내용이 풍부하면 최대 20개까지 가능하다. 각 샷은 개별 영상 클립이 된다.'
    : ''

  return PROMPT_CHAIN2_TEMPLATE
    .replace(/{episodeNumber}/g, episodeNumber)
    .replace('{demoInstruction}', demoInstruction)
    .replace('{assetList}', assetList || '(에셋 없음)')
    .replace('{novelText}', novelText || '(소설 텍스트 없음)')
}
