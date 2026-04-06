/**
 * @file DerivedCategoryGroup.jsx
 * @description 파생 이미지 카테고리 그룹 (프리셋명별 섹션).
 * @usage DerivedImagesPage에서 카테고리별 이미지 그룹 표시 시 사용.
 * @connects DerivedImageCard
 * @doc docs/04-visual-factory.md (파생 이미지)
 */
import DerivedImageCard from './DerivedImageCard.jsx'

export default function DerivedCategoryGroup({ categoryName, images, selectedPresets, onToggleSelection }) {
  const passCount = images.filter((img) => img.filter_result === 'PASS').length
  const total = images.length

  return (
    <div className="space-y-3">
      {/* 카테고리 헤더 */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-slate-300">{categoryName}</h3>
        <span className="text-xs text-slate-600 tabular-nums">
          {total > 0 ? `${passCount}/${total}` : total}
        </span>
        <div className="flex-1 h-px bg-slate-700/50" />
      </div>

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-5 gap-2">
        {images.map((image) => (
          <DerivedImageCard 
            key={image.image_id ?? image.preset_name} 
            image={image} 
            isSelected={selectedPresets?.includes(image.preset_key)}
            onToggle={onToggleSelection}
          />
        ))}
      </div>
    </div>
  )
}
