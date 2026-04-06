/**
 * @file EpisodeListPage.jsx
 * @description 4a. 에피소드 관리 페이지. 전체 에피소드 목록 + 추가/삭제.
 * @usage 라우트 "/project/:id/episode"
 * @connects useProjectStore, episodeApi
 * @doc docs/05-episode.md
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import Button from '../../../shared/components/ui/Button.jsx'
import Badge from '../../../shared/components/ui/Badge.jsx'
import {
  EPISODE_STATUS_LABELS,
  EPISODE_STATUS_COLORS,
} from '../constants/episodeStatus.js'

export default function EpisodeListPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const fetchEpisodes = useProjectStore((s) => s.fetchEpisodes)
  const createEpisode = useProjectStore((s) => s.createEpisode)
  const deleteEpisode = useProjectStore((s) => s.deleteEpisode)

  const [hint, setHint] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    if (id) fetchEpisodes(id).catch(() => {})
  }, [id, fetchEpisodes])

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-slate-500">프로젝트를 찾을 수 없습니다.</div>
  }

  const episodes = [...(project.episodes || [])].sort(
    (a, b) => a.episode_number - b.episode_number
  )

  const nextEpisodeNumber = (episodes[episodes.length - 1]?.episode_number ?? 0) + 1

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const ep = await createEpisode(id, nextEpisodeNumber, hint)
      navigate(`/project/${id}/episode/${ep.id}/novel`, { state: { hint, episodeNumber: nextEpisodeNumber } })
    } catch (err) {
      logError('EpisodeListPage.handleCreate', err, { projectId: id })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (episodeId) => {
    setDeletingId(episodeId)
    try {
      await deleteEpisode(id, episodeId)
    } catch (err) {
      logError('EpisodeListPage.handleDelete', err, { projectId: id, episodeId })
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const getEpisodeNavTarget = (ep) => {
    if (ep.status === 'CONFIRMED' || ep.status === 'STORYBOARD') {
      return `/project/${id}/episode/${ep.id}/storyboard`
    }
    if (ep.status === 'CHAIN_DESIGN' || ep.scenes?.length > 0) {
      return `/project/${id}/episode/${ep.id}/chain-design`
    }
    if (ep.status === 'NOVEL' || ep.novel_text) {
      return `/project/${id}/episode/${ep.id}/chain-design`
    }
    return `/project/${id}/episode/${ep.id}/novel`
  }

  const totalShotCount = (ep) =>
    (ep.scenes || []).reduce((sum, sc) => sum + (sc.shots?.length ?? 0), 0)

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">에피소드 목록</h1>
          <p className="text-sm text-slate-400 mt-1">{episodes.length}개 에피소드</p>
        </div>
        <Button onClick={() => setShowNewForm((v) => !v)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          새 에피소드
        </Button>
      </div>

      {/* 새 에피소드 인라인 폼 */}
      {showNewForm && (
        <div className="bg-slate-800 border border-teal-500/30 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-teal-400">
            에피소드 {nextEpisodeNumber} 생성
          </h3>
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder='힌트 (선택사항) — 예: "카이가 과거 동료를 만났으면 좋겠어"'
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 placeholder-slate-500 resize-none outline-none focus:border-teal-500/50 transition-colors"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowNewForm(false); setHint('') }}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              취소
            </button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? '생성 중...' : '프롬프트 생성 →'}
            </Button>
          </div>
        </div>
      )}

      {/* 에피소드가 없을 때 */}
      {episodes.length === 0 && !showNewForm && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-sm">아직 에피소드가 없습니다.</p>
          <p className="text-sm mt-1">새 에피소드 버튼으로 시작하세요.</p>
        </div>
      )}

      {/* 에피소드 카드 목록 */}
      <div className="space-y-3">
        {episodes.map((ep) => {
          const statusColor = EPISODE_STATUS_COLORS[ep.status] || EPISODE_STATUS_COLORS.DRAFT
          const statusLabel = EPISODE_STATUS_LABELS[ep.status] || ep.status
          const sceneCount = (ep.scenes || []).length
          const shotCount = totalShotCount(ep)
          const isDeleting = deletingId === ep.id
          const isConfirming = confirmDeleteId === ep.id

          return (
            <div
              key={ep.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-slate-600 transition-colors"
            >
              {/* 왼쪽: 에피소드 정보 */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-slate-300">{ep.episode_number}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-200">
                      에피소드 {ep.episode_number}
                    </span>
                    <Badge bg={statusColor.bg} text={statusColor.text}>{statusLabel}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{sceneCount}씬</span>
                    <span>·</span>
                    <span>{shotCount}샷</span>
                    {ep.hint && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[200px]">{ep.hint}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 오른쪽: 액션 버튼 */}
              <div className="flex items-center gap-2 shrink-0">
                {isConfirming ? (
                  <>
                    <span className="text-xs text-red-400 mr-1">정말 삭제할까요?</span>
                    <button
                      onClick={() => handleDelete(ep.id)}
                      disabled={isDeleting}
                      className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmDeleteId(ep.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded"
                      title="에피소드 삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigate(getEpisodeNavTarget(ep))}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                    >
                      열기
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
