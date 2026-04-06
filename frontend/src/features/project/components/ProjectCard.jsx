/**
 * @file ProjectCard.jsx
 * @description 프로젝트 카드. 썸네일 + 상태 오버레이 + 제목/장르 + 통계 + 아바타 행.
 * @usage ProjectListPage에서 각 프로젝트마다 렌더링.
 * @connects ProjectStatusBadge.jsx, Badge.jsx, badgeConfig.js
 * @doc docs/01-project.md (프로젝트 카드 표시 정보)
 */
import { useNavigate } from 'react-router-dom'
import Badge from '../../../shared/components/ui/Badge.jsx'
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_OVERLAY, VISUAL_STYLE_LABELS, VISUAL_STYLE_COLORS } from '../../../shared/constants/badgeConfig.js'

export default function ProjectCard({ project, onDelete }) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/project/${project.id}/seed`)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`'${project.title}' 프로젝트를 삭제하시겠습니까?`)) {
      onDelete(project.id)
    }
  }

  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status
  const statusColors = PROJECT_STATUS_OVERLAY[project.status] || { bg: 'bg-slate-600', text: 'text-white' }
  const vsLabel = VISUAL_STYLE_LABELS[project.visual_style] || '포토리얼'
  const vsColors = VISUAL_STYLE_COLORS[project.visual_style] || VISUAL_STYLE_COLORS.PHOTOREALISTIC

  return (
    <div
      onClick={handleClick}
      className="bg-[#141d2e] border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 cursor-pointer transition-colors group relative"
    >
      {/* Delete Button (Overlay) */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-800/50 hover:bg-red-500/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all border border-slate-700/50"
        title="프로젝트 삭제"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Thumbnail */}
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: project.thumbnailGradient }}
      >
        {/* Status overlay badge */}
        <div className="absolute top-3 left-3">
          <Badge bg={statusColors.bg} text={statusColors.text} className="text-xs font-semibold shadow-lg">
            {statusLabel}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title + Genre + Visual Style */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-white font-[family-name:var(--font-headline)] min-w-0 truncate">
            {project.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge bg={vsColors.bg} text={vsColors.text} className="text-xs">
              {vsLabel}
            </Badge>
            <Badge bg="bg-transparent" text="text-slate-400" className="border border-slate-600 text-xs">
              {project.genre}
            </Badge>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25c0 .621.504 1.125 1.125 1.125M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m1.5 3.75c0-.621-.504-1.125-1.125-1.125" />
            </svg>
            에피소드 {project.episodeCount}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
            에셋 {project.assetCount}
          </span>
          <span className="ml-auto text-slate-500">최근 수정: {project.updatedAt}</span>
        </div>

        {/* Bottom: Avatars + Link */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
          <div className="flex items-center gap-1">
            {project.isNew ? (
              <span className="text-xs font-semibold text-green-400">NEW</span>
            ) : (
              <>
                {(project.teamAvatars || []).map((avatar, i) => (
                  <span
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-[#141d2e] inline-flex items-center justify-center text-[10px] text-white font-bold"
                    style={{ backgroundColor: avatar.color, marginLeft: i > 0 ? '-4px' : '0' }}
                  >
                    {avatar.initial}
                  </span>
                ))}
                {project.teamExtra > 0 && (
                  <span className="text-xs text-slate-400 ml-1.5">+{project.teamExtra}</span>
                )}
              </>
            )}
          </div>
          <span className="text-xs text-teal-400 group-hover:text-teal-300 transition-colors">
            프로젝트 관리 &rsaquo;
          </span>
        </div>
      </div>
    </div>
  )
}
