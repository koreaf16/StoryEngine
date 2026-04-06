/**
 * @file EpisodeConfirmPage.jsx
 * @description 4d. 에피소드 확정 + TTS 처리 페이지. TTS 생성/검증/Export/세계 갱신 상태 표시.
 * @usage 라우트 "/project/:id/episode/:episodeId/confirm"
 * @connects ProcessingCard, VoiceLengthWarning, useProjectStore
 * @doc docs/05-episode.md (7. 에피소드 확정, 8. 세계 상태 갱신)
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import Button from '../../../shared/components/ui/Button.jsx'
import ProcessingCard from '../components/confirm/ProcessingCard.jsx'
import VoiceLengthWarning from '../components/confirm/VoiceLengthWarning.jsx'
import { saveVector, saveNode, saveEdge } from '../../../services/memoryApi.js'

export default function EpisodeConfirmPage() {
  const { id, episodeId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const confirmEpisode = useProjectStore((s) => s.confirmEpisode)

  const [ttsStatus, setTtsStatus] = useState('pending')
  const [memoryStatus, setMemoryStatus] = useState('pending')
  const [isConfirming, setIsConfirming] = useState(false)

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-slate-500">프로젝트를 찾을 수 없습니다.</div>
  }

  const episode = (project.episodes || []).find((ep) => ep.id === episodeId)
  const scenes = episode?.scenes || []
  const totalDialogues = scenes.reduce(
    (sum, s) => sum + (s.shots || []).reduce((ss, sh) => ss + (sh.dialogues?.length || 0), 0), 0
  )

  const warnings = []
  const hasWarnings = ttsStatus === 'complete' && warnings.length > 0
  const exportReady = ttsStatus === 'complete' && !hasWarnings

  const handleStartTts = async () => {
    setTtsStatus('processing')
    try {
      const res = await fetch(`/api/episode/${episodeId}/tts`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      setTtsStatus('complete')
    } catch (err) {
      logError('EpisodeConfirmPage.handleStartTts', err, { projectId: id, episodeId })
      setTtsStatus('error')
    }
  }

  const saveMemory = async () => {
    setMemoryStatus('processing')
    try {
      const protagonists = (project.assets || []).filter((a) => a.is_protagonist)
      for (const scene of scenes) {
        const summaryText = `EP${episode?.episode_number} ${scene.title}: ${scene.core_event}`
        await saveVector(id, { episodeId, sceneNumber: scene.scene_number, summaryText })
      }
      for (const asset of protagonists) {
        await saveNode(id, {
          nodeType: 'CHARACTER',
          label: asset.display_name,
          properties: { asset_id: asset.asset_id, profile_status: asset.profile_status },
          episodeId,
        })
      }
      if (protagonists.length >= 2) {
        await saveEdge(id, {
          sourceNodeId: protagonists[0].asset_id,
          targetNodeId: protagonists[1].asset_id,
          edgeType: 'CO_APPEARED',
          weight: 1,
          properties: { episode_id: episodeId },
          episodeId,
        })
      }
      setMemoryStatus('complete')
    } catch (err) {
      logError('EpisodeConfirmPage.saveMemory', err, { projectId: id, episodeId })
      setMemoryStatus('error')
    }
  }

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await saveMemory()
      await confirmEpisode(id, episodeId)
      navigate(`/project/${id}/episode`)
    } catch (error) {
      logError('EpisodeConfirmPage.handleConfirm', error, { projectId: id, episodeId })
      navigate(`/project/${id}/episode`)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">
          EP{episode?.episode_number} 확정
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          후처리 파이프라인을 실행합니다
        </p>
      </div>

      {/* 1. TTS 일괄 생성 */}
      <ProcessingCard
        title="TTS 일괄 생성"
        status={ttsStatus}
        subtitle={ttsStatus === 'complete' ? `${totalDialogues}개 대사 생성됨` : `${totalDialogues}개 대사 대기`}
        icon={
          <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        }
      >
        {ttsStatus === 'pending' && (
          <Button onClick={handleStartTts} className="text-xs">TTS 생성 시작</Button>
        )}
        {ttsStatus === 'processing' && (
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            생성 중...
          </div>
        )}
        {ttsStatus === 'error' && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            TTS 생성 실패.&nbsp;
            <button onClick={handleStartTts} className="underline">재시도</button>
          </div>
        )}
      </ProcessingCard>

      {/* 2. 음성 길이 검증 */}
      <ProcessingCard
        title="음성 길이 검증"
        status={hasWarnings ? 'warning' : ttsStatus === 'complete' ? 'complete' : 'pending'}
        subtitle={hasWarnings ? `경고 ${warnings.length}건` : null}
        icon={
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        {hasWarnings && <VoiceLengthWarning warnings={warnings} />}
      </ProcessingCard>

      {/* 3. Export JSON 조립 */}
      <ProcessingCard
        title="Export JSON 조립"
        status={exportReady ? 'complete' : 'pending'}
        subtitle={!exportReady ? '경고 해결 후 진행' : 'Video Factory 전달 준비 완료'}
        icon={
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        }
      />

      {/* 4. 메모리/그래프 저장 */}
      <ProcessingCard
        title="메모리 / 그래프 저장"
        status={memoryStatus}
        subtitle={
          memoryStatus === 'complete'
            ? `씬 ${scenes.length}개 벡터 저장 완료`
            : memoryStatus === 'processing'
            ? '저장 중...'
            : '확정 버튼 클릭 시 자동 실행'
        }
        icon={
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 10-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036" />
          </svg>
        }
      >
        {memoryStatus === 'pending' && (
          <div className="space-y-1 text-xs text-slate-500">
            <p>- Vector DB: 씬 요약 텍스트 저장</p>
            <p>- Graph DB: 주인공 캐릭터 노드 + 관계 저장</p>
          </div>
        )}
        {memoryStatus === 'error' && (
          <p className="text-xs text-red-400">저장 실패 (에피소드 확정은 진행됩니다)</p>
        )}
      </ProcessingCard>

      {/* 하단 액션 */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <Button variant="ghost" onClick={() => navigate(`/project/${id}/episode/${episodeId}/storyboard`)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          스토리보드로 돌아가기
        </Button>
        <Button onClick={handleConfirm} disabled={isConfirming}>
          {isConfirming ? '확정 중...' : '에피소드 확정'}
        </Button>
      </div>
    </div>
  )
}
