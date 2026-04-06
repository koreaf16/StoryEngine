/**
 * @file AssetSelectPage.jsx
 * @description 3-a: Visual Factory 에셋 목록 페이지. 타입 필터 + 파이프라인 상태 표시.
 * @usage /project/:id/visual 라우트에서 렌더링.
 * @connects AssetSelectRow, AssetTypeFilter, store/useProjectStore.js
 * @doc docs/04-visual-factory.md (에셋 선택 화면)
 */
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import AssetSelectRow from '../components/asset-list/AssetSelectRow.jsx'
import AssetTypeFilter from '../components/asset-list/AssetTypeFilter.jsx'

export default function AssetSelectPage() {
  const { id } = useParams()
  const project = useProjectStore((s) => s.getProject(id))
  const [activeFilter, setActiveFilter] = useState('ALL')

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        프로젝트를 찾을 수 없습니다.
      </div>
    )
  }

  const assets = (project.assets ?? []).filter((a) => a.is_protagonist)
  const filtered = activeFilter === 'ALL'
    ? assets
    : assets.filter((a) => a.asset_type === activeFilter)

  const trainedCount = assets.filter((a) => a.pipeline_status === 'LORA_TRAINED').length

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">외형 공장</h1>
        <p className="text-sm text-slate-400 mt-1">
          주인공 에셋의 앵커 이미지를 생성하고 LoRA 학습을 진행합니다.
        </p>
      </div>

      {/* 진행 요약 */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700">
        <div className="text-sm text-slate-400">
          <span className="text-teal-400 font-semibold text-base">{trainedCount}</span>
          <span className="ml-1">/ {assets.length} 완료</span>
        </div>
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all"
            style={{ width: assets.length > 0 ? `${(trainedCount / assets.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* 필터 */}
      <AssetTypeFilter activeFilter={activeFilter} onChange={setActiveFilter} />

      {/* 에셋 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          {activeFilter === 'ALL' ? '주인공 에셋이 없습니다.' : `주인공 중 ${activeFilter} 타입 에셋이 없습니다.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((asset) => (
            <AssetSelectRow key={asset.asset_id} asset={asset} projectId={id} />
          ))}
        </div>
      )}
    </div>
  )
}
