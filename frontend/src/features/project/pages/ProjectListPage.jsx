/**
 * @file ProjectListPage.jsx
 * @description 프로젝트 목록 페이지. 시스템 접속 시 첫 화면. AppShell 레이아웃 사용.
 * @usage 라우트 "/" 에서 렌더링.
 * @connects AppShell, ProjectCard, NewProjectCard, NewProjectModal, useProjectStore
 * @doc docs/01-project.md (프로젝트 목록 화면)
 */
import { useState, useEffect } from 'react'
import useProjectStore from '../../../store/useProjectStore.js'
import AppShell from '../../../shared/components/layout/AppShell.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { logError } from '../../../shared/utils/logger.js'
import ProjectCard from '../components/ProjectCard.jsx'
import NewProjectCard from '../components/NewProjectCard.jsx'
import NewProjectModal from '../components/NewProjectModal.jsx'

export default function ProjectListPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const projects = useProjectStore((s) => s.projects)
  const fetchProjects = useProjectStore((s) => s.fetchProjects)
  const deleteProject = useProjectStore((s) => s.deleteProject)

  useEffect(() => {
    fetchProjects().catch((error) => {
      logError('ProjectListPage.fetchProjects', error)
    })
  }, [fetchProjects])

  return (
    <AppShell>
      <div className="px-8 py-8 max-w-6xl">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-headline)]">
              나의 프로젝트
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              AI 프로덕션 워크플로우를 관리하고 새로운 에피소드를 생성하세요.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              최신순
            </Button>
            <Button onClick={() => setModalOpen(true)}>
              + 새 프로젝트
            </Button>
          </div>
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={deleteProject} />
          ))}
          <NewProjectCard onClick={() => setModalOpen(true)} />
        </div>
      </div>

      <NewProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </AppShell>
  )
}
