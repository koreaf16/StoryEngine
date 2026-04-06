/**
 * @file NewAssetAlert.jsx
 * @description 골격 응답에서 감지된 신규 에셋 알림 배너. 확인/제외 선택.
 * @usage SkeletonPromptPage.jsx에서 골격 파싱 후 표시.
 * @connects store/useProjectStore.js (addAsset)
 * @doc docs/05-episode.md (신규 에셋 감지)
 */
import Badge from '../../../../shared/components/ui/Badge.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'

export default function NewAssetAlert({ newAssets, onConfirm, onDismiss }) {
  if (!newAssets || newAssets.length === 0) return null

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span className="text-sm font-medium text-amber-400">신규 에셋 감지</span>
      </div>

      <div className="space-y-2">
        {newAssets.map((asset) => (
          <div key={asset.asset_id} className="flex items-center gap-2 text-sm">
            <Badge bg="bg-amber-500/20" text="text-amber-300">New</Badge>
            <span className="text-slate-300">{asset.asset_id}</span>
            <span className="text-slate-500">({asset.display_name})</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="primary" onClick={onConfirm} className="text-xs px-3 py-1.5">
          확인 — 자동 등록
        </Button>
        <Button variant="ghost" onClick={onDismiss} className="text-xs px-3 py-1.5">
          제외하고 다시 생성
        </Button>
      </div>
    </div>
  )
}
