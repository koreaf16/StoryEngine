/**
 * @file AssetSelectRow.jsx
 * @description 에셋 목록의 개별 행. 파이프라인 상태 뱃지 + 클릭 시 앵커 페이지 이동.
 * @usage AssetSelectPage에서 에셋 목록 렌더링 시 사용.
 * @connects shared/constants/colors.js, shared/constants/badgeConfig.js, features/visual/constants/pipelineStatus.js
 * @doc docs/04-visual-factory.md (에셋 선택 화면)
 */
import { useNavigate } from 'react-router-dom'
import { ASSET_TYPE_COLORS, AVATAR_COLORS } from '../../../../shared/constants/colors.js'
import { ASSET_TYPE_LABELS, PIPELINE_STATUS_LABELS } from '../../../../shared/constants/badgeConfig.js'
import { PIPELINE_ORDER } from '../../constants/pipelineStatus.js'

function PipelineStatusBadge({ status }) {
  const label = PIPELINE_STATUS_LABELS[status] ?? status

  if (status === 'NONE') {
    return (
      <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
        {label}
      </span>
    )
  }
  if (status === 'DERIVED_FILTERED') {
    return (
      <span className="px-2 py-0.5 rounded text-xs bg-teal-500/20 text-teal-400 flex items-center gap-1">
        <span>✓</span> {label}
      </span>
    )
  }
  if (status === 'ANCHOR_GENERATING' || status === 'DERIVED_GENERATING') {
    return (
      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 animate-pulse">
        {label}
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs bg-slate-600/40 text-slate-300">
      {label}
    </span>
  )
}

export default function AssetSelectRow({ asset, projectId }) {
  const navigate = useNavigate()
  const typeColor = ASSET_TYPE_COLORS[asset.asset_type]
  const avatarBg = AVATAR_COLORS[asset.asset_type] ?? 'bg-slate-600'
  const typeLabel = ASSET_TYPE_LABELS[asset.asset_type] ?? asset.asset_type
  const progress = PIPELINE_ORDER[asset.pipeline_status] ?? 0
  const maxProgress = 4
  const hasImages = !!asset.anchor_image

  function handleClick() {
    const base = `/project/${projectId}/visual/${asset.asset_id}`
    if (progress >= 4) {
      navigate(`${base}/gallery`)
    } else if (progress >= 2) {
      navigate(`${base}/derived`)
    } else {
      navigate(`${base}/anchor`)
    }
  }

  function handleGallery(e) {
    e.stopPropagation()
    navigate(`/project/${projectId}/visual/${asset.asset_id}/gallery`)
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-4 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500 hover:bg-slate-750 cursor-pointer transition-colors group"
    >
      {/* 앵커 썸네일 or 아바타 */}
      <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ${hasImages ? '' : avatarBg + ' flex items-center justify-center'}`}>
        {hasImages ? (
          <img src={asset.anchor_image.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-sm font-bold">{asset.display_name.charAt(0)}</span>
        )}
      </div>

      {/* 이름 + 타입 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-100 group-hover:text-white">
            {asset.display_name}
          </span>
          {typeColor && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${typeColor.bg} ${typeColor.text}`}>
              {typeLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5 max-w-md">
          {asset.appearance_prompt}
        </p>
      </div>

      {/* 진행률 바 */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <PipelineStatusBadge status={asset.pipeline_status} />
        <div className="w-24 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all"
            style={{ width: `${(progress / maxProgress) * 100}%` }}
          />
        </div>
      </div>

      {/* 이미지 갤러리 버튼 — 앵커가 있을 때만 표시 */}
      {hasImages && (
        <button
          onClick={handleGallery}
          title="이미지 갤러리 보기"
          className="p-1.5 rounded text-slate-500 hover:text-teal-400 hover:bg-slate-700 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}

      {/* 화살표 */}
      <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}
