/**
 * @file CharacterConfirmPage.jsx
 * @description 2-c. 캐릭터 프로필 확정 페이지. 2패널 레이아웃으로 프로필 확인/수정.
 * @usage 라우트 "/project/:id/characters/:assetId/confirm"
 * @connects ProjectShell(레이아웃), ProfileSection, ProfileEditModal, ProfileStatusBadge,
 *           useProjectStore
 * @doc docs/03-character-setup.md (UI 흐름 — 결과 표시)
 */
import { useState } from 'react'
import { Navigate, useParams, useNavigate } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import Badge from '../../../shared/components/ui/Badge.jsx'
import ProfileSection from '../components/ProfileSection.jsx'
import ProfileEditModal from '../components/ProfileEditModal.jsx'
import ProfileStatusBadge from '../components/ProfileStatusBadge.jsx'
import useProjectStore from '../../../store/useProjectStore.js'
import { ASSET_TYPE_COLORS, AVATAR_COLORS } from '../../../shared/constants/colors.js'
import { ASSET_TYPE_LABELS } from '../../../shared/constants/badgeConfig.js'

export default function CharacterConfirmPage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const updateAsset = useProjectStore((s) => s.updateAsset)
  const confirmCharacterProfile = useProjectStore((s) => s.confirmCharacterProfile)

  const [editModal, setEditModal] = useState({ isOpen: false, sectionKey: null, data: null })

  if (!project) return <div className="p-8 text-slate-400">프로젝트를 찾을 수 없습니다.</div>

  const asset = project.assets.find((a) => a.asset_id === assetId)
  if (!asset) return <div className="p-8 text-slate-400">에셋을 찾을 수 없습니다.</div>

  // 프로필 없으면 프롬프트 페이지로 리다이렉트
  if (!asset.personality && !asset.speech_style && !asset.backstory && !asset.behavioral_rules) {
    navigate(`/project/${id}/characters/${assetId}/prompt`, { replace: true })
    return null
  }

  const hasProfile =
    asset.profile_status === 'AUTO'
    || asset.profile_status === 'CONFIRMED'
    || asset.personality
    || asset.speech_style
    || asset.backstory
    || (Array.isArray(asset.behavioral_rules) && asset.behavioral_rules.length > 0)

  if (!hasProfile) {
    return <Navigate to={`/project/${id}/characters/${assetId}/prompt`} replace />
  }

  const typeColor = ASSET_TYPE_COLORS[asset.asset_type] ?? ASSET_TYPE_COLORS.CHARACTER
  const avatarBg = AVATAR_COLORS[asset.asset_type] ?? 'bg-slate-600'

  const openEdit = (sectionKey, data) => setEditModal({ isOpen: true, sectionKey, data })
  const closeEdit = () => setEditModal({ isOpen: false, sectionKey: null, data: null })

  const handleSectionSave = (sectionKey, updatedData) => {
    updateAsset(id, assetId, { [sectionKey]: updatedData })
  }

  const handleConfirm = async () => {
    await confirmCharacterProfile(id, assetId)
    navigate(`/project/${id}/characters`)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(`/project/${id}/characters`)}
        className="text-slate-400 hover:text-slate-300 transition-colors text-sm mb-6 block"
      >
        ← 캐릭터 목록
      </button>

      {/* 2패널 레이아웃 */}
      <div className="flex gap-6">
        {/* 좌측: 캐릭터 정보 */}
        <div className="w-48 shrink-0">
          <div className={`w-full aspect-square rounded-xl ${avatarBg} flex items-center justify-center mb-4 overflow-hidden border border-slate-700/50`}>
            {asset.anchor_image?.image_url ? (
              <img
                src={asset.anchor_image.image_url}
                alt={asset.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl font-bold text-white">{asset.display_name.charAt(0)}</span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white font-[family-name:var(--font-headline)] text-center">
            {asset.display_name}
          </h2>
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <Badge bg={typeColor.bg} text={typeColor.text}>
              {ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type}
            </Badge>
            <ProfileStatusBadge status={asset.profile_status ?? 'NONE'} />
            {asset.voice_hint && (
              <span className="text-xs text-slate-500 mt-1">{asset.voice_hint}</span>
            )}
          </div>
        </div>

        {/* 우측: 프로필 섹션들 */}
        <div className="flex-1 space-y-3 min-w-0">
          <ProfileSection
            title="성격"
            sectionKey="personality"
            data={asset.personality}
            onEdit={openEdit}
          />
          <ProfileSection
            title="말투"
            sectionKey="speech_style"
            data={asset.speech_style}
            onEdit={openEdit}
          />
          <ProfileSection
            title="과거"
            sectionKey="backstory"
            data={asset.backstory}
            onEdit={openEdit}
          />
          <ProfileSection
            title="행동 규칙"
            sectionKey="behavioral_rules"
            data={asset.behavioral_rules}
            onEdit={openEdit}
          />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex justify-between mt-8">
        <Button variant="secondary" onClick={() => navigate(`/project/${id}/characters/${assetId}/prompt`)}>
          ← 다시 생성
        </Button>
        <Button onClick={handleConfirm}>
          확정 →
        </Button>
      </div>

      {/* 편집 모달 */}
      <ProfileEditModal
        key={`${editModal.sectionKey || 'profile'}-${editModal.isOpen ? 'open' : 'closed'}`}
        isOpen={editModal.isOpen}
        onClose={closeEdit}
        sectionKey={editModal.sectionKey}
        data={editModal.data}
        onSave={handleSectionSave}
      />
    </div>
  )
}
