/**
 * @file Sidebar.jsx
 * @description 좌측 사이드바. 브랜드 로고 + 프로젝트명 + 4단계 네비게이션 + 플랜 카드.
 * @usage ProjectShell.jsx 좌측에 렌더링. 프로젝트 내부 페이지에서만 표시.
 * @connects react-router-dom (NavLink, useLocation)
 * @doc docs/10-ui-spec.md (사이드바 네비게이션)
 */
import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    key: 'script',
    label: 'Script',
    pathSegments: ['seed', 'prompt-a', 'paste-a', 'prompt-b', 'assets'],
    href: (projectId) => `/project/${projectId}/seed`,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    key: 'character',
    label: 'Character',
    pathSegments: ['characters', 'prompt', 'confirm'],
    href: (projectId) => `/project/${projectId}/characters`,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
  },
  {
    key: 'visual',
    label: 'Visual',
    pathSegments: ['visual', 'anchor', 'derived', 'complete'],
    href: (projectId) => `/project/${projectId}/visual`,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    key: 'episode',
    label: 'Episode',
    pathSegments: ['episode', 'novel', 'chain-design', 'skeleton', 'storyboard', 'confirm'],
    href: (projectId) => `/project/${projectId}/episode`,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
      </svg>
    ),
  },
]

function getActiveKey(pathname) {
  const segment = pathname.split('/').pop()
  for (const item of NAV_ITEMS) {
    if (item.pathSegments.includes(segment)) return item.key
  }
  return null
}

export default function Sidebar({ projectId, projectTitle }) {
  const { pathname } = useLocation()
  const activeKey = getActiveKey(pathname)

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-slate-700/50 bg-[#0b1121]">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <h2 className="text-sm font-bold text-teal-400 tracking-wider uppercase font-[family-name:var(--font-headline)]">
          Story Engine
        </h2>
        {projectTitle ? (
          <p className="text-xs text-slate-300 mt-0.5 truncate" title={projectTitle}>{projectTitle}</p>
        ) : (
          <p className="text-xs text-slate-500 mt-0.5">AI Orchestrator</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeKey
          return (
            <NavLink
              key={item.key}
              to={item.href(projectId)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors no-underline
                ${isActive
                  ? 'bg-teal-500/10 text-teal-400 border-l-[3px] border-teal-400 pl-[9px]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border-l-[3px] border-transparent pl-[9px]'
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Plan card */}
      <div className="px-4 pb-5">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <p className="text-[10px] text-slate-500 tracking-wider uppercase mb-1">Current Plan</p>
          <p className="text-sm font-semibold text-white">Pro Orchestrator</p>
          <div className="mt-2.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-blue-500 rounded-full" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">75% of compute used</p>
        </div>
      </div>
    </aside>
  )
}
