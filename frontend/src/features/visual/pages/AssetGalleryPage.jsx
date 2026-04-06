/**
 * @file features/visual/pages/AssetGalleryPage.jsx
 * @description 3-e: 에셋 앵커/파생 이미지 갤러리. 기존 이미지 전체 열람 + 재작업 진입점.
 * @usage /project/:id/visual/:assetId/gallery 라우트.
 * @connects useProjectStore, loraApi.js, AnchorSelectPage, DerivedImagesFlowPage, LoraCompletePage
 * @doc docs/04-visual-factory.md
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteLoRA } from '../../../services/visual/loraApi.js'
import { logError } from '../../../shared/utils/logger.js'
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

function DeleteLoraPanel({ assetId, projectId, onDeleted }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs text-orange-400 transition-colors hover:text-orange-300"
      >
        LoRA 삭제 후 재학습
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-orange-300">학습된 LoRA가 영구 삭제됩니다.</span>
      <button onClick={() => setConfirm(false)} className="text-xs text-slate-400 hover:text-slate-200">취소</button>
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          try {
            await deleteLoRA(assetId)
            onDeleted()
            navigate(`/project/${projectId}/visual/${assetId}/derived`)
          } catch (err) {
            logError('AssetGalleryPage.deleteLora', err, { assetId })
            setConfirm(false)
            setLoading(false)
          }
        }}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
      >
        {loading ? '삭제 중...' : '삭제 확인'}
      </button>
    </div>
  )
}

export default function AssetGalleryPage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const resetLoraAsset = useProjectStore((s) => s.resetLoraAsset)
  const asset = project?.assets?.find((a) => a.asset_id === assetId)

  if (!asset) {
    return <div className="flex h-64 items-center justify-center text-slate-500">에셋을 찾을 수 없습니다.</div>
  }

  const typeLabel = ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type
  const typeColor = ASSET_TYPE_COLORS[asset.asset_type]
  const derivedImages = asset.derived_images ?? []
  const hasDerived = derivedImages.length > 0
  const hasAnchor = !!asset.anchor_image
  const isLoraReady = asset.pipeline_status === 'LORA_TRAINED'

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
        {asset.trigger_word && (
          <code className="rounded bg-teal-500/15 px-2 py-0.5 text-xs text-teal-400">{asset.trigger_word}</code>
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

      {/* LoRA 정보 */}
      {asset.lora_result && (
        <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="text-sm font-medium text-slate-300">LoRA 정보</h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Trigger word</div>
              <code className="text-teal-400 text-sm">{asset.lora_result.trigger_word || '-'}</code>
            </div>
            <div>
              <div className="text-xs text-slate-500">학습 이미지</div>
              <span className="text-slate-200">{asset.lora_result.training_images ?? '-'}장</span>
            </div>
            <div>
              <div className="text-xs text-slate-500">상태</div>
              <span className={isLoraReady ? 'text-teal-400' : 'text-yellow-400'}>
                {isLoraReady ? '✓ 완료' : '진행 중'}
              </span>
            </div>
          </div>
          {isLoraReady && (
            <div className="border-t border-slate-700 pt-3">
              <DeleteLoraPanel
                assetId={assetId}
                projectId={id}
                onDeleted={() => resetLoraAsset(id, assetId)}
              />
            </div>
          )}
        </section>
      )}

      {/* 하단 네비게이션 */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/project/${id}/visual`)}
          className="flex-1 rounded-lg bg-slate-700 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600"
        >
          에셋 목록
        </button>
        {isLoraReady ? (
          <button
            onClick={() => navigate(`/project/${id}/visual/${assetId}/complete`)}
            className="flex-1 rounded-lg bg-teal-600 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-500"
          >
            LoRA 완료 페이지 →
          </button>
        ) : hasAnchor ? (
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
