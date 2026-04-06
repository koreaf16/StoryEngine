/**
 * @file NovelPage.jsx
 * @description Chain 1 — 에피소드 소설 생성 페이지. 자유 산문 입력 → novel_text 저장 → chain-design으로 이동.
 * @usage 라우트 "/project/:id/episode/:episodeId/novel"
 * @connects PromptCopyPaste, buildPromptNovel, useProjectStore, memoryApi
 * @doc docs/05-episode.md (Chain 1: 소설 생성)
 */
import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import PromptCopyPaste from '../../../shared/components/patterns/PromptCopyPaste.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import buildPromptNovel from '../utils/buildPromptNovel.js'
import { getVectors, getGraph } from '../../../services/memoryApi.js'

export default function NovelPage() {
  const { id, episodeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const project = useProjectStore((s) => s.getProject(id))
  const saveNovelText = useProjectStore((s) => s.saveNovelText)
  const fetchEpisodes = useProjectStore((s) => s.fetchEpisodes)

  const [recentMemory, setRecentMemory] = useState(null)
  const [graphState, setGraphState] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const hint = location.state?.hint || ''
  const existingEpisode = project?.episodes?.find((ep) => ep.id === episodeId)
  const episodeNumber = location.state?.episodeNumber
    || existingEpisode?.episode_number
    || (project?.episodes?.filter((ep) => ep.status === 'CONFIRMED')?.length || 0) + 1

  useEffect(() => {
    if (!id) return
    getVectors(id)
      .then((vectors) => {
        if (vectors.length > 0) {
          const latest = vectors[vectors.length - 1]
          setRecentMemory(latest.summary_text)
        }
      })
      .catch(() => {})
    getGraph(id)
      .then((graph) => setGraphState(graph))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (id && !project?.episodes) {
      fetchEpisodes(id).catch(() => {})
    }
  }, [id, project, fetchEpisodes])

  const promptText = useMemo(() => {
    if (!project) return ''
    return buildPromptNovel({
      episodeNumber,
      project,
      assets: project.assets || [],
      recentMemory,
      graphState,
      userHint: hint,
    })
  }, [project, episodeNumber, recentMemory, graphState, hint])

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-slate-500">프로젝트를 찾을 수 없습니다.</div>
  }

  const handleSubmit = async (novelText) => {
    setError('')
    if (!novelText || !novelText.trim()) {
      setError('소설 텍스트를 붙여넣어 주세요.')
      return
    }
    setSaving(true)
    try {
      await saveNovelText(id, episodeId, novelText.trim())
      navigate(`/project/${id}/episode/${episodeId}/chain-design`, {
        state: { hint, episodeNumber },
      })
    } catch (err) {
      logError('NovelPage.handleSubmit', err, { projectId: id, episodeId })
      setError('소설 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-100">
            에피소드 {episodeNumber} — 소설 생성
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/30">
            Chain 1
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          자유로운 한국어 산문으로 에피소드 이야기를 생성합니다. 씬 설계(Chain 2)의 기반이 됩니다.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <PromptCopyPaste
        title="프롬프트 — Chain 1: 에피소드 소설 생성"
        description="LLM에 붙여넣고 자유로운 한국어 산문 응답을 받아 아래에 붙여넣으세요."
        promptText={promptText}
        submitLabel={saving ? '저장 중…' : '소설 저장 후 씬 설계로 →'}
        onSubmit={handleSubmit}
      />

      <div className="flex justify-start">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← 뒤로
        </Button>
      </div>
    </div>
  )
}
