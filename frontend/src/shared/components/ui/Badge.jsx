/**
 * @file Badge.jsx
 * @description 범용 뱃지(pill) 컴포넌트. 에셋 타입, 시각 전략, 프로젝트 상태 등에 사용.
 * @usage ProjectCard, AssetRow, 스토리보드 등 뱃지가 필요한 모든 곳.
 * @connects shared/constants/colors.js
 * @doc docs/10-ui-spec.md (에셋 상태 뱃지)
 */

export default function Badge({ children, bg = 'bg-slate-600/30', text = 'text-slate-400', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text} ${className}`}>
      {children}
    </span>
  )
}
