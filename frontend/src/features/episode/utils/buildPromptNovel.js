/**
 * @file buildPromptNovel.js
 * @description Chain 1 소설 생성 프롬프트 조립. 주인공 프로필 직렬화 + 기억/그래프 주입.
 * @usage NovelPage.jsx에서 호출.
 * @connects features/episode/constants/promptTemplateNovel.js
 * @doc docs/05-episode.md (Chain 1: 소설 생성)
 */
import { PROMPT_NOVEL_TEMPLATE } from '../constants/promptTemplateNovel.js'

function serializeProtagonistProfiles(assets) {
  const protagonists = assets.filter((a) => a.is_protagonist)
  if (protagonists.length === 0) return '(주인공 프로필 미설정)'
  return protagonists.map((a) => {
    const lines = [`[${a.display_name}]`]
    if (a.personality?.core_trait) lines.push(`  성격: ${a.personality.core_trait}`)
    if (a.speech_style?.tone) lines.push(`  말투: ${a.speech_style.tone}`)
    if (a.backstory) lines.push(`  배경: ${typeof a.backstory === 'string' ? a.backstory : JSON.stringify(a.backstory)}`)
    return lines.join('\n')
  }).join('\n\n')
}

function serializeGraphState(graphState) {
  if (!graphState) return '(관계 정보 없음)'
  const nodes = graphState.nodes || []
  const edges = graphState.edges || []
  if (nodes.length === 0 && edges.length === 0) return '(관계 정보 없음)'
  const nodeLines = nodes.map((n) => `  - ${n.label || n.node_id}: ${n.properties ? JSON.stringify(n.properties) : ''}`)
  const edgeLines = edges.map((e) => `  - ${e.source_node_id} → ${e.target_node_id} [${e.edge_type}]`)
  return [
    nodeLines.length > 0 ? `노드:\n${nodeLines.join('\n')}` : '',
    edgeLines.length > 0 ? `관계:\n${edgeLines.join('\n')}` : '',
  ].filter(Boolean).join('\n')
}

export default function buildPromptNovel({
  episodeNumber,
  project,
  assets,
  recentMemory,
  graphState,
  userHint,
}) {
  const worldBackbone = typeof project?.worldBackbone === 'string'
    ? project.worldBackbone
    : (project?.worldBackbone ? JSON.stringify(project.worldBackbone) : '(세계관 미설정)')

  const storyCompass = typeof project?.storyCompass === 'string'
    ? project.storyCompass
    : (project?.storyCompass ? JSON.stringify(project.storyCompass) : '(방향타 미설정)')

  const protagonistProfiles = serializeProtagonistProfiles(assets || [])
  const graphText = serializeGraphState(graphState)
  const memoryText = recentMemory || '(첫 에피소드 — 이전 기억 없음)'

  return PROMPT_NOVEL_TEMPLATE
    .replace(/{episodeNumber}/g, episodeNumber)
    .replace('{worldBackbone}', worldBackbone)
    .replace('{storyCompass}', storyCompass)
    .replace('{protagonistProfiles}', protagonistProfiles)
    .replace('{recentMemory}', memoryText)
    .replace('{graphState}', graphText)
    .replace('{userHint}', userHint || '(없음)')
}
