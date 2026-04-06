/**
 * @file PasteResponsePage.jsx
 * @description Legacy pass-1 paste route that redirects into the current script flow.
 * @usage Route "/project/:id/paste-a"
 * @connects ProjectShell, useProjectStore, react-router-dom Navigate
 * @doc docs/02-script-input.md
 */
import { Navigate, useParams } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'

export default function PasteResponsePage() {
  const { id } = useParams()
  const project = useProjectStore((s) => s.getProject(id))

  if (!project) {
    return <div className="p-8 text-slate-400">Project not found.</div>
  }

  if (project.worldBackbone) {
    return <Navigate to={`/project/${id}/prompt-b`} replace />
  }

  return <Navigate to={`/project/${id}/prompt-a`} replace />
}
