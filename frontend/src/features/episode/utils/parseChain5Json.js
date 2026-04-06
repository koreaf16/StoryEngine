/**
 * @file parseChain5Json.js
 * @description Chain 5 응답 파서. 샷별 영상 프롬프트(video_prompt) 추출 및 검증.
 * @usage useChainDesign.js에서 Chain 5 응답 파싱 시 사용.
 * @connects features/episode/pages/ChainDesignPage.jsx
 * @doc docs/05-episode.md (Chain 5: 영상 프롬프트)
 */
import { logError } from '../../../shared/utils/logger.js'

export default function parseChain5Json(raw) {
  const trimmed = raw.trim()
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, trimmed]
  const jsonStr = jsonMatch[1].trim()

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch (error) {
    logError('parseChain5Json', error, { preview: jsonStr.slice(0, 200) })
    return { ok: false, error: 'JSON 파싱 실패. 올바른 JSON 형식인지 확인하세요.' }
  }

  const items = Array.isArray(parsed) ? parsed : parsed?.shots
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: '영상 프롬프트 배열이 비어있습니다.' }
  }

  for (const item of items) {
    if (item.scene_number === undefined || item.shot_number === undefined) {
      return { ok: false, error: 'scene_number 또는 shot_number가 없는 항목이 있습니다.' }
    }
    if (!item.video_prompt || !item.video_prompt.trim()) {
      return { ok: false, error: `씬 ${item.scene_number} 샷 ${item.shot_number}: video_prompt가 없습니다.` }
    }
  }

  const videoPrompts = items.map((item) => ({
    scene_number: item.scene_number,
    shot_number: item.shot_number,
    video_prompt: item.video_prompt.trim(),
    duration_sec: item.duration_sec ?? 4.0,
    fps: item.fps ?? 24,
    chain_last_frame: item.chain_last_frame === true,
  }))

  return { ok: true, videoPrompts }
}
