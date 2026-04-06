/**
 * @file buildPromptD.js
 * @description 프롬프트 D(에피소드 골격 생성) 조립 유틸. 세계관 + 에셋 + 기억을 합쳐 프롬프트 생성.
 * @usage EpisodeStartPage → SkeletonPromptPage에서 호출.
 * @connects features/episode/constants/promptTemplates.js, store/useProjectStore.js
 * @doc docs/05-episode.md (2. 골격 생성 — 프롬프트 D)
 */
import { PROMPT_D_TEMPLATE } from '../constants/promptTemplates.js'

export default function buildPromptD({ episodeNumber, assets, storyCompass, characterProfiles, memory, userHint }) {
  const assetList = assets
    .map((a) => `- ${a.asset_id} (${a.display_name}, ${a.asset_type})`)
    .join('\n')

  const profiles = characterProfiles
    || assets
      .filter((a) => a.asset_type === 'CHARACTER' || a.asset_type === 'NPC')
      .map((a) => {
        const speechTone = a.speech_style?.tone || ''
        const coreTrail = a.personality?.core_trait || ''
        const info = [coreTrail, speechTone].filter(Boolean).join(' / ')
        return `[${a.display_name}] ${info || '(프로필 없음)'}`
      })
      .join('\n')

  return PROMPT_D_TEMPLATE
    .replace('{episodeNumber}', episodeNumber)
    .replace('{assetList}', assetList || '(없음)')
    .replace('{storyCompass}', storyCompass || '(방향타 미설정)')
    .replace('{characterProfiles}', profiles || '(프로필 미설정)')
    .replace('{memory}', memory || '(첫 에피소드 — 기억 없음)')
    .replace('{userHint}', userHint || '(없음)')
}
