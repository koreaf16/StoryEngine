/**
 * @file SceneGroup.jsx
 * @description 스토리보드의 씬 그룹. 씬 헤더 + 소속 ShotCard 목록.
 * @usage StoryboardPage.jsx에서 씬별로 렌더링.
 * @connects ShotCard.jsx
 * @doc docs/05-episode.md (6. 스토리보드 UI)
 */
import Badge from '../../../../shared/components/ui/Badge.jsx'
import ShotCard from './ShotCard.jsx'

export default function SceneGroup({ scene, assets, onEditShot, onDeleteShot, onRegenerateShot, regeneratingShot }) {
  const locationAsset = assets.find((a) => a.asset_id === scene.location_asset)

  return (
    <div className="space-y-3">
      {/* 씬 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">SCENE {scene.scene_number}</span>
          <h3 className="text-sm font-semibold text-white">{scene.title}</h3>
        </div>
        {locationAsset && (
          <Badge bg="bg-blue-500/20" text="text-blue-400">{locationAsset.display_name}</Badge>
        )}
        <span className="text-xs text-slate-600">{scene.shots?.length || 0} shots</span>
      </div>

      {/* 핵심 사건 */}
      <p className="text-xs text-slate-500 -mt-1">{scene.core_event}</p>

      {/* 샷 카드 목록 */}
      <div className="space-y-2 pl-2 border-l-2 border-slate-700/50">
        {(scene.shots || []).map((shot) => (
          <ShotCard
            key={shot.shot_number}
            shot={shot}
            assets={assets}
            onEdit={(s) => onEditShot(scene.scene_number, s)}
            onDelete={(s) => onDeleteShot(scene.scene_number, s)}
            onRegenerate={(s) => onRegenerateShot(scene.scene_number, s)}
            isRegenerating={
              regeneratingShot?.sceneNumber === scene.scene_number &&
              regeneratingShot?.shotNumber === shot.shot_number
            }
          />
        ))}
      </div>
    </div>
  )
}
