/**
 * @file Button.jsx
 * @description 범용 버튼 컴포넌트. primary(teal), secondary(outline), ghost 변형 지원.
 * @usage 모든 페이지의 액션 버튼.
 * @connects 없음 (독립 UI 컴포넌트)
 */

const variants = {
  primary: 'bg-teal-600 hover:bg-teal-700 text-white',
  secondary: 'border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white',
  ghost: 'text-slate-400 hover:text-white hover:bg-slate-800',
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
        transition-colors duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
