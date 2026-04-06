/**
 * @file AssetConfirmPage.jsx
 * @description 1e. 에셋 확정 페이지. 추출된 에셋을 확인/수정/삭제하고 확정.
 * @usage 라우트 "/project/:id/assets"
 * @connects ProjectShell(레이아웃), AssetRow, useProjectStore
 * @doc docs/02-script-input.md (에셋 확정)
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import AssetRow from '../components/AssetRow.jsx'
import AssetEditModal from '../components/AssetEditModal.jsx'
import useProjectStore from '../../../store/useProjectStore.js'

export default function AssetConfirmPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const removeAsset = useProjectStore((s) => s.removeAsset)
  const updateAsset = useProjectStore((s) => s.updateAsset)
  const confirmAssets = useProjectStore((s) => s.confirmAssets)

  const [editingAsset, setEditingAsset] = useState(null)

  if (!project) return <div className="p-8 text-slate-400">프로젝트를 찾을 수 없습니다.</div>

  // 주인공 먼저 정렬
  const sortedAssets = [...(project.assets || [])].sort((a, b) => {
    if (a.is_protagonist && !b.is_protagonist) return -1
    if (!a.is_protagonist && b.is_protagonist) return 1
    return 0
  })

  const protagonists = sortedAssets.filter((a) => a.is_protagonist)

  const handleEdit = (asset) => {
    setEditingAsset(asset)
  }

  const handleSaveEdit = (updatedAsset) => {
    updateAsset(id, updatedAsset.asset_id, updatedAsset)
  }

  const handleRemove = (assetId) => {
    if (window.confirm('이 에셋을 삭제하시겠습니까?')) {
      removeAsset(id, assetId)
    }
  }

  const handleConfirm = () => {
    confirmAssets(id)
    navigate(`/project/${id}/characters`)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white font-[family-name:var(--font-headline)]">
          에셋 확정
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          추출된 에셋을 확인하고 수정하세요. 확정 후 DB에 등록됩니다.
        </p>
      </div>

      {sortedAssets.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          에셋이 없습니다. 프롬프트 B에서 에셋을 추출해주세요.
        </div>
      ) : (
        <div className="space-y-2">
          {protagonists.length > 0 && (
            <p className="text-xs text-teal-400 mb-1">★ 주인공 — 캐릭터/비주얼 설정 우선 진행</p>
          )}
          {sortedAssets.map((asset) => (
            <AssetRow
              key={asset.asset_id}
              asset={asset}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="secondary" onClick={() => navigate(`/project/${id}/prompt-b`)}>
          ← 프롬프트 B로 돌아가기
        </Button>
        <Button onClick={handleConfirm} disabled={project.assets.length === 0}>
          확정하고 다음 단계로 →
        </Button>
      </div>

      <AssetEditModal
        isOpen={!!editingAsset}
        onClose={() => setEditingAsset(null)}
        asset={editingAsset}
        onSave={handleSaveEdit}
      />
    </div>
  )
}
