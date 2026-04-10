/**
 * @file ChainDesignPage.jsx
 * @description Chain 2~5 통합 페이지. 씬·샷 설계 → 이미지 프롬프트 → 영상 프롬프트 순차 진행.
 * @usage 라우트 "/project/:id/episode/:episodeId/chain-design"
 * @connects useChainDesign, ChainProgressChecklist, PromptCopyPaste, useProjectStore
 * @doc docs/05-episode.md (Chain 2~5 흐름)
 */
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import PromptCopyPaste from '../../../shared/components/patterns/PromptCopyPaste.jsx'
import ChainProgressChecklist from '../components/chain/ChainProgressChecklist.jsx'
import NewAssetAnchorReview from '../components/chain/NewAssetAnchorReview.jsx'
import useChainDesign from '../hooks/useChainDesign.js'

export default function ChainDesignPage() {
  const { id, episodeId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))

  const existingEpisode = project?.episodes?.find((ep) => ep.id === episodeId)
  const episodeNumber = location.state?.episodeNumber
    || existingEpisode?.episode_number
    || (project?.episodes?.filter((ep) => ep.status === 'CONFIRMED')?.length || 0) + 1

  const {
    phase, error, DEMO_MODE, newAssets,
    promptChain2, promptChain4, promptChain5,
    handleChain2Submit, handleChain4Submit, handleChain5Submit, handleNewAssetsConfirmed,
  } = useChainDesign({ projectId: id, episodeId, episodeNumber })

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-slate-500">프로젝트를 찾을 수 없습니다.</div>
  }

  const phaseConfig = {
    CHAIN2: {
      title: `에피소드 ${episodeNumber} — 씬·샷 설계`,
      description: '소설을 바탕으로 씬과 샷을 동시에 설계합니다.',
      promptLabel: 'Chain 2: 씬·샷 설계',
      promptText: promptChain2,
      submitLabel: '씬·샷 저장 →',
      onSubmit: handleChain2Submit,
    },
    CHAIN4: {
      title: `에피소드 ${episodeNumber} — 이미지 프롬프트`,
      description: '샷별 Flux 5블록 이미지 프롬프트를 생성합니다.',
      promptLabel: 'Chain 4: 이미지 프롬프트 (Flux)',
      promptText: promptChain4,
      submitLabel: '이미지 프롬프트 저장 →',
      onSubmit: handleChain4Submit,
    },
    CHAIN5: {
      title: `에피소드 ${episodeNumber} — 영상 프롬프트`,
      description: '샷별 Wan2.2 I2V 영상 프롬프트를 생성합니다.',
      promptLabel: 'Chain 5: 영상 프롬프트 (Wan2.2 I2V)',
      promptText: promptChain5,
      submitLabel: '영상 프롬프트 저장 후 스토리보드로 →',
      onSubmit: handleChain5Submit,
    },
  }

  const current = phaseConfig[phase]

  if (phase === 'CHAIN5_DONE') {
    return (
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">에피소드 {episodeNumber} — 설계 완료</h1>
          <p className="text-sm text-slate-400 mt-1">Chain 2~5가 모두 완료되었습니다.</p>
        </div>
        <ChainProgressChecklist phase={phase} />
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/project/${id}/episode/${episodeId}/storyboard`)}
            className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-400 transition-colors"
          >
            스토리보드로 →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-100">{current?.title}</h1>
          {DEMO_MODE && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              DEMO
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 mt-1">{current?.description}</p>
        {DEMO_MODE && <p className="text-xs text-amber-500/70 mt-0.5">씬 1개 · 사운드 SKIP — 빠른 테스트 모드</p>}
      </div>

      <ChainProgressChecklist phase={phase} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {newAssets.length > 0 ? (
        <NewAssetAnchorReview
          projectId={id}
          newAssets={newAssets}
          onAllConfirmed={handleNewAssetsConfirmed}
        />
      ) : current && (
        <PromptCopyPaste
          key={phase}
          title={current.promptLabel}
          description={current.description}
          promptText={current.promptText}
          submitLabel={current.submitLabel}
          onSubmit={current.onSubmit}
        />
      )}
    </div>
  )
}
