/**
 * @file TopNav.jsx
 * @description 상단 네비게이션 바. 로고 + ORCHESTRATOR 뱃지 + 중앙 탭 + 우측 아이콘.
 * @usage AppShell.jsx 최상단에 렌더링.
 * @connects Badge.jsx
 * @doc docs/10-ui-spec.md (전체 화면 구조 — 상단 헤더)
 */
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'

export default function TopNav() {
  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-slate-700/50 bg-[#0b1121]">
      {/* Left: Logo + Badge */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-lg font-bold text-white font-[family-name:var(--font-headline)] no-underline">
          Story Engine
        </Link>
        <Badge bg="bg-teal-500/20" text="text-teal-400" className="text-[10px] tracking-wider uppercase font-semibold">
          Orchestrator
        </Badge>
      </div>

      {/* Center: Nav links */}
      <nav className="flex items-center gap-8">
        <Link to="/" className="text-sm text-teal-400 border-b-2 border-teal-400 pb-0.5 no-underline font-medium">
          Projects
        </Link>
        <span className="text-sm text-slate-500 cursor-default">Library</span>
        <span className="text-sm text-slate-500 cursor-default">Templates</span>
      </nav>

      {/* Right: Settings + Profile icons */}
      <div className="flex items-center gap-4 text-slate-400">
        <button className="hover:text-white transition-colors cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button className="hover:text-white transition-colors cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
