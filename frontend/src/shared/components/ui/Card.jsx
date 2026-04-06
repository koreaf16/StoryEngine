/**
 * @file Card.jsx
 * @description 범용 카드 컴포넌트. 다크 테마 서피스 스타일.
 * @usage 프로젝트 카드, 프롬프트 카드, 프로필 섹션 카드 등.
 * @connects 없음 (독립 UI 컴포넌트)
 */

export default function Card({ children, className = '', onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-800 border border-slate-700 rounded-lg
        ${hover ? 'hover:border-slate-600 hover:bg-slate-800/80 cursor-pointer transition-colors' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
