/**
 * @file Header.jsx
 * @description 상단 헤더 바. 프로젝트명(좌) + 현재 단계 뱃지(우) 표시.
 * @usage Layout.jsx에서 항상 렌더링. 프로젝트 내부 페이지에서 프로젝트명 표시.
 * @connects store/useProjectStore.js (현재 프로젝트 정보)
 * @doc docs/10-ui-spec.md (전체 화면 구조 — 상단 헤더)
 */
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge.jsx'

export default function Header({ projectTitle, phaseBadge }) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-3 no-underline">
        <h1 className="text-lg font-bold text-white font-[family-name:var(--font-headline)]">
          Story Engine
        </h1>
        {projectTitle && (
          <>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-300">{projectTitle}</span>
          </>
        )}
      </Link>
      {phaseBadge && (
        <Badge bg={phaseBadge.bg} text={phaseBadge.text}>
          {phaseBadge.label}
        </Badge>
      )}
    </header>
  )
}
