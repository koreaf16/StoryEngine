/**
 * @file EpisodeStartPage.jsx
 * @description 4a. 에피소드 시작 페이지. 컨텍스트 요약 + 캐릭터 상태 + 힌트 입력 + 프롬프트 생성.
 * @usage 라우트 "/project/:id/episode/new" (EpisodeListPage의 "새 에피소드"에서 접근)
 * @connects ContextPanel, CharacterStatusCard, MemoryStateCard, useProjectStore
 * @doc docs/05-episode.md (에피소드 생성 모드, 컨텍스트 조립)
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import Button from '../../../shared/components/ui/Button.jsx'
import Badge from '../../../shared/components/ui/Badge.jsx'
import ContextPanel from '../components/start/ContextPanel.jsx'
import CharacterStatusCard from '../components/start/CharacterStatusCard.jsx'
import MemoryStateCard from '../components/start/MemoryStateCard.jsx'
import { EPISODE_STATUS_COLORS } from '../constants/episodeStatus.js'

export default function EpisodeStartPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const fetchEpisodes = useProjectStore((s) => s.fetchEpisodes)
  const createEpisode = useProjectStore((s) => s.createEpisode)
  const [hint, setHint] = useState('')

  useEffect(() => {
    if (id) fetchEpisodes(id).catch(() => {})
  }, [id, fetchEpisodes])

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-slate-500">프로젝트를 찾을 수 없습니다.</div>
  }

  const episodes = project.episodes || []
  const confirmedEpisodes = episodes.filter((ep) => ep.status === 'CONFIRMED')
  const draftEpisode = episodes.find((ep) => ep.status !== 'CONFIRMED')
  const nextEpisodeNumber = draftEpisode?.episode_number || confirmedEpisodes.length + 1

  const characters = (project.assets || []).filter(
    (a) => a.is_protagonist
  )

  const getResumeRoute = (ep) => {
    if (ep.novel_text && ep.scenes?.length > 0 && ep.scenes.every((s) => s.shots?.length > 0)) {
      return `/project/${id}/episode/${ep.id}/storyboard`
    }
    if (ep.novel_text) return `/project/${id}/episode/${ep.id}/chain-design`
    return `/project/${id}/episode/${ep.id}/novel`
  }

  const handleGenerate = async () => {
    if (draftEpisode) {
      navigate(getResumeRoute(draftEpisode), { state: { hint, episodeNumber: draftEpisode.episode_number } })
      return
    }
    try {
      const ep = await createEpisode(id, nextEpisodeNumber, hint)
      navigate(`/project/${id}/episode/${ep.id}/novel`, { state: { hint, episodeNumber: nextEpisodeNumber } })
    } catch (error) {
      logError('EpisodeStartPage.handleGenerate', error, { projectId: id, episodeNumber: nextEpisodeNumber })
      navigate(`/project/${id}/episode/new/novel`, { state: { hint, episodeNumber: nextEpisodeNumber } })
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">
          에피소드 {nextEpisodeNumber} 만들기
        </h1>
        <div className="flex items-center gap-2 mt-2">
          {confirmedEpisodes.map((ep) => (
            <Badge key={ep.id} bg={EPISODE_STATUS_COLORS.CONFIRMED.bg} text={EPISODE_STATUS_COLORS.CONFIRMED.text}>
              EP{ep.episode_number} 확정
            </Badge>
          ))}
          {confirmedEpisodes.length === 0 && (
            <span className="text-sm text-slate-500">첫 번째 에피소드입니다</span>
          )}
        </div>
      </div>

      {/* 컨텍스트 요약 */}
      <ContextPanel project={project} />

      {/* 캐릭터 상태 */}
      {characters.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white">등장 캐릭터</h3>
          <div className="space-y-2">
            {characters.map((asset) => (
              <CharacterStatusCard key={asset.asset_id} asset={asset} />
            ))}
          </div>
        </div>
      )}

      {/* 기억 상태 */}
      <MemoryStateCard episodeNumber={nextEpisodeNumber} />

      {/* 힌트 입력 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          힌트 (선택사항)
        </label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder='예: "카이가 과거 동료를 만났으면 좋겠어" 또는 비워두면 자동 생성'
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 placeholder-slate-500 resize-none outline-none focus:border-teal-500/50 transition-colors"
        />
      </div>

      {/* 프롬프트 생성 버튼 */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleGenerate}>
          프롬프트 생성
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
