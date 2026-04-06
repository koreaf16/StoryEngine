/**
 * @file DerivedImageCard.jsx
 * @description 파생 이미지 카드. 얼굴 거리 수치 + 통과/탈락/스킵 상태 오버레이.
 * @usage DerivedCategoryGroup에서 파생 이미지 렌더링 시 사용.
 * @connects DerivedCategoryGroup, shared/constants/colors.js
 * @doc docs/04-visual-factory.md (파생 이미지)
 */
import { FILTER_RESULT_COLORS, GRADE_COLORS } from '../../../../shared/constants/colors.js'

const FILTER_LABEL = { PASS: '통과', FAIL: '탈락', SKIP: '스킵' }

export default function DerivedImageCard({ image, isSelected, onToggle }) {
  const filterColor = image.filter_result ? FILTER_RESULT_COLORS[image.filter_result] : null
  const gradeColor = image.grade ? GRADE_COLORS[image.grade] : null

  return (
    <div 
      className={`relative rounded-lg overflow-hidden ring-2 cursor-pointer transition-all ${
        isSelected ? 'ring-teal-500' : 'ring-slate-700 hover:ring-slate-500'
      }`}
      onClick={() => onToggle && onToggle(image.preset_key)}
    >
      {/* 이미지 */}
      <div className="aspect-square bg-slate-800">
        {image.image_url ? (
          <img
            src={image.image_url}
            alt={image.preset_name ?? '파생 이미지'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* 등급 뱃지 */}
      {gradeColor && (
        <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-xs font-bold ${gradeColor.bg} ${gradeColor.text}`}>
          {image.grade}
        </div>
      )}

      {/* 선택 오버레이 */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white shadow pointer-events-none z-10">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* 탈락 오버레이 */}
      {image.filter_result === 'FAIL' && (
        <div className="absolute inset-0 bg-red-900/30 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      )}

      {/* 하단 정보 */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 truncate">{image.preset_name}</span>
          {filterColor && (
            <span className={`text-xs font-medium ${filterColor.text}`}>
              {FILTER_LABEL[image.filter_result]}
            </span>
          )}
        </div>
        {image.face_distance != null && (
          <div className="text-xs text-slate-500 tabular-nums">
            거리 {image.face_distance.toFixed(3)}
          </div>
        )}
      </div>
    </div>
  )
}
