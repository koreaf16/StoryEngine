/**
 * @file Footer.jsx
 * @description 하단 푸터. 프로젝트 상태 인디케이터 + 링크 + 저작권.
 * @usage AppShell.jsx 메인 콘텐츠 하단에 렌더링.
 * @connects 없음 (독립 레이아웃 컴포넌트)
 * @doc docs/10-ui-spec.md (전체 화면 구조)
 */

const STATUS_DOTS = [
  { label: 'Active Prod', color: 'bg-green-500' },
  { label: 'Character Dev', color: 'bg-pink-500' },
  { label: 'Scripting', color: 'bg-slate-500' },
]

export default function Footer() {
  return (
    <footer className="flex items-center justify-between px-8 py-4 border-t border-slate-700/30 text-[11px] text-slate-500 tracking-wider uppercase">
      {/* Status indicators */}
      <div className="flex items-center gap-6">
        {STATUS_DOTS.map((dot) => (
          <div key={dot.label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dot.color}`} />
            <span>{dot.label}</span>
          </div>
        ))}
      </div>

      {/* Links + copyright */}
      <div className="flex items-center gap-6">
        <span className="hover:text-slate-300 cursor-pointer transition-colors">Documentation</span>
        <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
        <span className="text-slate-600">|</span>
        <span>&copy; 2024 Story Engine AI</span>
      </div>
    </footer>
  )
}
