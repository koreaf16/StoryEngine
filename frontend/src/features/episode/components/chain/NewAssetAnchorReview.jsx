/**
 * @file NewAssetAnchorReview.jsx
 * @description Chain 2에서 신규 감지된 에셋의 앵커 자동생성 리뷰 UI.
 *   앵커 썸네일 + 새로고침 + 비주얼 설정 링크 + 확인/건너뛰기 버튼.
 * @usage ChainDesignPage에서 신규 에셋 감지 시 표시.
 * @connects useAutoAnchor, useProjectStore
 * @doc docs/04-visual-factory.md (앵커 선택)
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../../../shared/components/ui/Button.jsx'
import useAutoAnchor from '../../hooks/useAutoAnchor.js'

export default function NewAssetAnchorReview({ projectId, newAssets, onAllConfirmed }) {
  const navigate = useNavigate()
  const { anchorStates, generate, refresh, confirm, skip } = useAutoAnchor(projectId)

  // 신규 에셋 목록이 설정되면 앵커 자동생성 시작
  useEffect(() => {
    for (const asset of newAssets) {
      if (asset.appearance_prompt) generate(asset)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newAssets.map((a) => a.asset_id).join(',')])

  // 모든 에셋이 confirmed 되면 콜백
  useEffect(() => {
    if (newAssets.length === 0) return
    const allDone = newAssets.every((a) => anchorStates[a.asset_id]?.confirmed)
    if (allDone) onAllConfirmed()
  }, [anchorStates, newAssets, onAllConfirmed])

  if (newAssets.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-amber-400">신규 에셋 감지됨 — 앵커 자동생성</span>
        <span className="text-xs text-slate-500">확인 후 Chain 4로 진행됩니다</span>
      </div>
      {newAssets.map((asset) => {
        const state = anchorStates[asset.asset_id] || {}
        return (
          <div key={asset.asset_id} className="flex items-start gap-4 px-4 py-3 bg-slate-800 rounded-lg border border-amber-500/20">
            {/* 앵커 썸네일 */}
            <div className="w-16 h-16 shrink-0 rounded-md bg-slate-700 flex items-center justify-center overflow-hidden">
              {state.generating ? (
                <span className="text-xs text-slate-400 animate-pulse">생성 중…</span>
              ) : state.candidate?.url ? (
                <img src={state.candidate.url} alt="anchor" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-slate-500">없음</span>
              )}
            </div>

            {/* 에셋 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-white">{asset.display_name}</span>
                <span className="text-xs text-slate-500">{asset.asset_type}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">{asset.appearance_prompt || '(appearance_prompt 없음)'}</p>
              {state.error && <p className="text-xs text-red-400 mt-1">{state.error}</p>}
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-1 shrink-0">
              <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => refresh(asset)}
                disabled={state.generating}>
                새로고침
              </Button>
              <Button variant="ghost" className="text-xs px-2 py-1 text-blue-400"
                onClick={() => navigate(`/project/${projectId}/visual/${asset.asset_id}/anchor`)}>
                비주얼 설정
              </Button>
              {state.confirmed ? (
                <span className="text-xs text-teal-400 text-center px-2 py-1">✓ 확인됨</span>
              ) : (
                <>
                  <Button className="text-xs px-2 py-1" onClick={() => confirm(asset.asset_id)}
                    disabled={state.generating}>
                    확인
                  </Button>
                  <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => skip(asset.asset_id)}>
                    건너뛰기
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
