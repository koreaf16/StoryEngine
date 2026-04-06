/**
 * @file ProjectShell.jsx
 * @description 프로젝트 내부 쉘 레이아웃. TopNav + Sidebar(4단계) + 메인 콘텐츠.
 * @usage 프로젝트 내부 모든 페이지의 공통 래퍼. routes.jsx에서 중첩 라우트로 사용.
 * @connects TopNav.jsx, Sidebar.jsx, useProjectStore, react-router-dom Outlet
 * @doc docs/10-ui-spec.md (전체 화면 구조)
 */
import { useEffect } from 'react'
import { useParams, Outlet } from 'react-router-dom'
import TopNav from './TopNav.jsx'
import Sidebar from './Sidebar.jsx'
import useProjectStore from '../../../store/useProjectStore.js'

export default function ProjectShell() {
  const { id } = useParams()
  const project = useProjectStore((s) => s.getProject(id))
  const fetchProjectDetail = useProjectStore((s) => s.fetchProjectDetail)
  const isLoading = useProjectStore((s) => s.isLoading)
  const fetchError = useProjectStore((s) => s.fetchError)
  const hasProjectDetail = Boolean(project && Array.isArray(project.assets))

  useEffect(() => {
    if (!hasProjectDetail) {
      fetchProjectDetail(id)
    }
  }, [fetchProjectDetail, hasProjectDetail, id])

  if (fetchError && !hasProjectDetail) {
    return (
      <div className="min-h-screen bg-[#0d1525] flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">프로젝트 로드 실패: {fetchError}</p>
        <button
          onClick={() => fetchProjectDetail(id)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!hasProjectDetail) {
    return (
      <div className="min-h-screen bg-[#0d1525] flex items-center justify-center text-slate-400">
        {isLoading ? 'Loading project...' : 'Preparing project...'}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1525]">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar projectId={id} projectTitle={project.title} />
        <main className="flex-1 overflow-y-auto bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
