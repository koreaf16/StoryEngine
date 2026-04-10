/**
 * @file features/visual/pages/AssetGalleryPage.jsx
 * @description 3-e: 에셋 앵커/파생 이미지 갤러리. 기존 이미지 전체 열람 + 재작업 진입점.
 * @usage /project/:id/visual/:assetId/gallery 라우트에서 렌더링.
 * @connects useProjectStore, AnchorSelectPage, DerivedImagesFlowPage
 * @doc docs/04-visual-factory.md
 */
import { useNavigate, useParams } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { ASSET_TYPE_LABELS } from '../../../shared/constants/badgeConfig.js'
import { ASSET_TYPE_COLORS } from '../../../shared/constants/colors.js'

const FILTER_BADGE = {
  PASS: { label: '통과', cls: 'bg-teal-500/90 text-white' },
  FAIL: { label: '탈락', cls: 'bg-red-500/90 text-white' },
  SKIP: { label: '스킵', cls: 'bg-slate-600/90 text-slate-200' },
}

function FilterBadge({ result }) {
  const b = FILTER_BADGE[result]
  if (!b) return null
  return (
    <span className={`absolute bottom-1 right-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${b.cls}`}>
      {b.label}
    </span>
  )
}

function DerivedImageCard({ image }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-lg border border-slate-700 ${image.filter_result === 'FAIL' ? 'opacity-35' : ''}`}>
      <img src={image.image_url} alt={image.preset_name} className="h-full w-full object-cover" loading="lazy" />
      <FilterBadge result={image.filter_result} />
      {image.preset_name && (
        <div className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1.5 py-0.5 text-[9px] text-slate-300">
          {image.preset_name}
        </div>
      )}
    </div>
  )
}

function StatsBar({ images }) {
  const counts = images.reduce((acc, i) => {
    acc[i.filter_result ?? 'NONE'] = (acc[i.filter_result ?? 'NONE'] || 0) + 1
    return acc
  }, {})
  return (
    <div className="flex gap-3 text-xs">
      {counts.PASS > 0 && <span className="text-teal-400">통과 {counts.PASS}</span>}
      {counts.FAIL > 0 && <span className="text-red-400">탈락 {counts.FAIL}</span>}
      {counts.SKIP > 0 && <span className="text-slate-400">스킵 {counts.SKIP}</span>}
      {counts.NONE > 0 && <span className="text-slate-500">미필터 {counts.NONE}</span>}
    </div>
  )
}

export default function AssetGalleryPage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const asset = project?.assets?.find((a) => a.asset_id === assetId)

  if (!asset) {
    return <div className="flex h-64 items-center justify-center text-slate-500">에셋을 찾을 수 없습니다.</div>
  }

  const typeLabel = ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type
  const typeColor = ASSET_TYPE_COLORS[asset.asset_type]
  const derivedImages = asset.derived_images ?? []
  const hasDerived = derivedImages.length > 0
  const hasAnchor = !!asset.anchor_image

  // 카테고리별 그룹핑 + 정렬
  const categoryGroups = derivedImages.reduce((acc, img) => {
    const cat = img.category || '기타'
    ;(acc[cat] = acc[cat] || []).push(img)
    return acc
  }, {})

  return (
    <div className="max-w-4xl space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/project/${id}/visual`)}
          className="text-slate-500 transition-colors hover:text-slate-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-slate-100">{asset.display_name}</h1>
        {typeColor && (
          <span className={`rounded px-2 py-0.5 text-xs ${typeColor.bg} ${typeColor.text}`}>{typeLabel}</span>
        )}
      </div>

      {/* 앵커 이미지 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">앵커 이미지</h2>
          <button
            onClick={() => navigate(`/project/${id}/visual/${assetId}/anchor`)}
            className="text-xs text-slate-400 transition-colors hover:text-teal-400"
          >
            {hasAnchor ? '앵커 변경 →' : '앵커 생성하기 →'}
          </button>
        </div>
        {hasAnchor ? (
          <div className="w-52 h-52 overflow-hidden rounded-xl border border-slate-700">
            <img src={asset.anchor_image.image_url} alt="anchor" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
            앵커 이미지가 없습니다
          </div>
        )}
      </section>

      {/* 파생 이미지 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-slate-300">파생 이미지 ({derivedImages.length}장)</h2>
            {hasDerived && <StatsBar images={derivedImages} />}
          </div>
          <button
            onClick={() => navigate(`/project/${id}/visual/${assetId}/derived`)}
            className="text-xs text-slate-400 transition-colors hover:text-teal-400"
          >
            {hasDerived ? '재생성 →' : '생성하기 →'}
          </button>
        </div>

        {hasDerived ? (
          <div className="space-y-5">
            {Object.entries(categoryGroups).map(([cat, imgs]) => (
              <div key={cat} className="space-y-2">
                <h3 className="text-xs font-medium text-slate-500">{cat} ({imgs.length})</h3>
                <div className="grid grid-cols-6 gap-2">
                  {imgs.map((img) => <DerivedImageCard key={img.image_id} image={img} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
            파생 이미지가 없습니다
          </div>
        )}
      </section>

      {/* 하단 네비게이션 */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/project/${id}/visual`)}
          className="flex-1 rounded-lg bg-slate-700 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600"
        >
          에셋 목록으로
        </button>
        {hasAnchor ? (
          <button
            onClick={() => navigate(`/project/${id}/visual/${assetId}/derived`)}
            className="flex-1 rounded-lg bg-teal-600 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-500"
          >
            파생 이미지 생성 →
          </button>
        ) : (
          <button
            onClick={() => navigate(`/project/${id}/visual/${assetId}/anchor`)}
            className="flex-1 rounded-lg bg-teal-600 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-500"
          >
            앵커 이미지 생성 →
          </button>
        )}
      </div>
    </div>
  )
}
