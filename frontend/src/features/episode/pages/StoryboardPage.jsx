/**
 * @file StoryboardPage.jsx
 * @description 4c. 스토리보드 페이지. 씬별 그룹핑된 샷 카드 목록 + 편집/확정 + 스냅 생성 기능.
 * @usage 라우트 "/project/:id/episode/:episodeId/storyboard"
 * @connects SceneGroup, ShotEditModal, SnapGenerateBar, useSnapGeneration, useProjectStore
 * @doc docs/05-episode.md (5. 스냅 이미지 생성, 6. 스토리보드 UI)
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import Button from '../../../shared/components/ui/Button.jsx'
import SceneGroup from '../components/storyboard/SceneGroup.jsx'
import ShotEditModal from '../components/storyboard/ShotEditModal.jsx'
import SnapGenerateBar from '../components/storyboard/SnapGenerateBar.jsx'
import useSnapGeneration from '../hooks/useSnapGeneration.js'

export default function StoryboardPage() {
  const { id, episodeId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const updateShot = useProjectStore((s) => s.updateShot)
  const deleteShot = useProjectStore((s) => s.deleteShot)

  const [editingShot, setEditingShot] = useState(null)
  const [editingScene, setEditingScene] = useState(null)

  const { isGenerating, isRegenerating, completedCount, totalCount, currentTask, latestSnap, error: snapError, generate, regenerate, stop } = useSnapGeneration(id, episodeId)

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-slate-500">프로젝트를 찾을 수 없습니다.</div>
  }

  const episode = (project.episodes || []).find((ep) => ep.id === episodeId)
  const scenes = episode?.scenes || []
  const assets = project.assets || []
  const totalShots = scenes.reduce((sum, s) => sum + (s.shots?.length || 0), 0)
  const missingSnapCount = scenes.reduce((sum, s) => sum + (s.shots || []).filter((sh) => !sh.snap_image).length, 0)

  const handleEditShot = (sceneNumber, shot) => {
    setEditingScene(sceneNumber)
    setEditingShot(shot)
  }

  const handleSaveShot = (updatedShot) => {
    updateShot(id, episodeId, editingScene, updatedShot.shot_number, updatedShot).catch((error) => {
      logError('StoryboardPage.updateShot', error, { projectId: id, episodeId, sceneNumber: editingScene, shotNumber: updatedShot.shot_number })
    })
    setEditingShot(null)
    setEditingScene(null)
  }

  const handleDeleteShot = (sceneNumber, shot) => {
    if (!confirm(`샷 #${shot.shot_number}을(를) 삭제하시겠습니까?`)) return
    deleteShot(id, episodeId, sceneNumber, shot.shot_number).catch((error) => {
      logError('StoryboardPage.deleteShot', error, { projectId: id, episodeId, sceneNumber, shotNumber: shot.shot_number })
    })
  }

  const handleRegenerateShot = (sceneNumber, shot) => {
    regenerate(sceneNumber, shot.shot_number).catch((error) => {
      logError('StoryboardPage.regenerateSnap', error, { projectId: id, episodeId, sceneNumber, shotNumber: shot.shot_number })
    })
  }

  const handleConfirm = () => {
    navigate(`/project/${id}/episode/${episodeId}/confirm`)
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">
            EP{episode?.episode_number}: {episode?.title || '스토리보드'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            총 {scenes.length}개의 씬, {totalShots}개의 샷이 구성되었습니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            씬 추가
          </Button>
          <Button onClick={handleConfirm}>
            에피소드 확정
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Button>
        </div>
      </div>

      {/* 스냅 생성 바 */}
      <SnapGenerateBar
        missingCount={missingSnapCount}
        isGenerating={isGenerating}
        completedCount={completedCount}
        totalCount={totalCount}
        currentTask={currentTask}
        latestSnap={latestSnap}
        error={snapError}
        onGenerate={generate}
        onStop={stop}
      />

      {/* 씬 그룹 목록 */}
      {scenes.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-sm">스토리보드가 비어있습니다.</p>
          <p className="text-xs mt-1">골격/샷 생성 단계를 먼저 완료하세요.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {scenes.map((scene) => (
            <SceneGroup
              key={scene.scene_number}
              scene={scene}
              assets={assets}
              onEditShot={handleEditShot}
              onDeleteShot={handleDeleteShot}
              onRegenerateShot={handleRegenerateShot}
              regeneratingShot={isRegenerating}
            />
          ))}
        </div>
      )}

      {/* 샷 편집 모달 */}
      {editingShot && (
        <ShotEditModal
          shot={editingShot}
          onSave={handleSaveShot}
          onClose={() => { setEditingShot(null); setEditingScene(null) }}
        />
      )}
    </div>
  )
}
