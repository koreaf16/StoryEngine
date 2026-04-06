/**
 * @file CharacterPromptPage.jsx
 * @description 2-b. 캐릭터 프롬프트 C 페이지. LLM 생성 또는 직접 입력으로 프로필 생성.
 * @usage 라우트 "/project/:id/characters/:assetId/prompt"
 * @connects ProjectShell(레이아웃), TabSelector, PromptCopyPaste, DirectInputForm,
 *           buildPromptC, parseProfileJson, useProjectStore
 * @doc docs/03-character-setup.md (설정 방식 A, B)
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import PromptCopyPaste from '../../../shared/components/patterns/PromptCopyPaste.jsx'
import TabSelector from '../components/TabSelector.jsx'
import DirectInputForm from '../components/DirectInputForm.jsx'
import buildPromptC from '../utils/buildPromptC.js'
import parseProfileJson from '../utils/parseProfileJson.js'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import { ASSET_TYPE_COLORS, AVATAR_COLORS } from '../../../shared/constants/colors.js'
import { ASSET_TYPE_LABELS } from '../../../shared/constants/badgeConfig.js'
import Badge from '../../../shared/components/ui/Badge.jsx'

export default function CharacterPromptPage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const saveCharacterProfile = useProjectStore((s) => s.saveCharacterProfile)

  const [activeTab, setActiveTab] = useState('llm')
  const [error, setError] = useState('')

  if (!project) return <div className="p-8 text-slate-400">프로젝트를 찾을 수 없습니다.</div>

  const asset = project.assets.find((a) => a.asset_id === assetId)
  if (!asset) return <div className="p-8 text-slate-400">에셋을 찾을 수 없습니다.</div>

  const typeColor = ASSET_TYPE_COLORS[asset.asset_type] ?? ASSET_TYPE_COLORS.CHARACTER
  const avatarBg = AVATAR_COLORS[asset.asset_type] ?? 'bg-slate-600'
  const promptText = buildPromptC(asset, project.worldBackbone)

  const handleLLMSubmit = async (response) => {
    setError('')
    try {
      const profile = parseProfileJson(response)
      await saveCharacterProfile(id, assetId, profile, 'AUTO')
      navigate(`/project/${id}/characters/${assetId}/confirm`)
    } catch (e) {
      logError('CharacterPromptPage.handleLLMSubmit', e, { projectId: id, assetId })
      setError(e.message)
    }
  }

  const handleDirectSubmit = async (profile) => {
    setError('')
    await saveCharacterProfile(id, assetId, profile, 'AUTO')
    navigate(`/project/${id}/characters/${assetId}/confirm`)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/project/${id}/characters`)}
          className="text-slate-400 hover:text-slate-300 transition-colors text-sm"
        >
          ← 캐릭터 목록
        </button>
      </div>

      {/* 캐릭터 정보 + 탭 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center shrink-0`}>
            <span className="text-sm font-bold text-white">{asset.display_name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-[family-name:var(--font-headline)]">
              {asset.display_name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge bg={typeColor.bg} text={typeColor.text}>
                {ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}
              </Badge>
              {asset.voice_hint && (
                <span className="text-xs text-slate-500">{asset.voice_hint}</span>
              )}
            </div>
          </div>
        </div>
        <TabSelector activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'llm' ? (
        <PromptCopyPaste
          title="프롬프트 C: 캐릭터 프로필 생성"
          description="아래 프롬프트를 복사해서 외부 LLM에 붙여넣은 후, 응답을 아래에 붙여넣으세요."
          promptText={promptText}
          pasteLabel="JSON 형식의 결과물을 붙여넣으세요"
          submitLabel="파싱하고 프로필 확인 →"
          onSubmit={handleLLMSubmit}
        />
      ) : (
        <DirectInputForm onSubmit={handleDirectSubmit} />
      )}

      {/* 에러 배너 */}
      {error && (
        <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
