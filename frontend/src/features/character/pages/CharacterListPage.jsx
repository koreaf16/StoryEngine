/**
 * @file CharacterListPage.jsx
 * @description 2-a. 캐릭터 목록 페이지. TTS 에셋 필터링 + 프로필 진행률 표시.
 * @usage 라우트 "/project/:id/characters"
 * @connects ProjectShell(레이아웃), CharacterCard, useProjectStore
 * @doc docs/03-character-setup.md (UI 흐름)
 */
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import CharacterCard from '../components/CharacterCard.jsx'
import useProjectStore from '../../../store/useProjectStore.js'

export default function CharacterListPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const updateProjectStatus = useProjectStore((s) => s.updateProjectStatus)

  if (!project) {
    return <div className="p-8 text-slate-400">프로젝트를 찾을 수 없습니다.</div>
  }

  const assets = project.assets ?? []
  const ttsAssets = assets.filter((asset) => asset.is_protagonist && asset.audio_type === 'TTS')
  const confirmedCount = ttsAssets.filter((asset) => asset.profile_status === 'CONFIRMED').length
  const progressWidth = ttsAssets.length > 0 ? (confirmedCount / ttsAssets.length) * 100 : 0

  const confirmCharacterStep = async () => {
    await updateProjectStatus(id, 'VISUAL')
    navigate(`/project/${id}/visual`)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white font-[family-name:var(--font-headline)]">
          캐릭터 설정
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          주인공 캐릭터의 성격, 말투, 과거를 설정합니다. TTS 음성을 가진 주인공만 표시됩니다.
        </p>
      </div>

      {/* 진행률 */}
      {ttsAssets.length > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">
            {confirmedCount} / {ttsAssets.length} 확정
          </span>
        </div>
      )}

      {/* 캐릭터 목록 */}
      {ttsAssets.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          주인공 TTS 캐릭터가 없습니다. 에셋 확정 단계에서 주인공에 is_protagonist를 설정해주세요.
        </div>
      ) : (
        <div className="space-y-2">
          {ttsAssets.map((asset) => (
            <CharacterCard key={asset.asset_id} asset={asset} projectId={id} />
          ))}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex justify-between mt-8">
        <Button variant="secondary" onClick={() => navigate(`/project/${id}/assets`)}>
          ← 에셋 확정으로
        </Button>
        <Button onClick={confirmCharacterStep}>
          설정 완료하고 비주얼로 →
        </Button>
      </div>
    </div>
  )
}
