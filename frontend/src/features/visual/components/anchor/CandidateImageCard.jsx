/**
 * @file CandidateImageCard.jsx
 * @description 앵커 후보 이미지 카드. 등급 뱃지 + 선택 상태 + 클릭 선택.
 * variant='loading': 현재 생성 중인 활성 슬롯 (step progress bar 표시)
 * variant='waiting': 대기 중인 슬롯 (pulsing skeleton)
 * variant='image' (default): 완료된 실제 이미지 카드
 * @usage CandidateGrid에서 후보 이미지 목록 렌더링 시 사용.
 * @connects CandidateGrid, shared/constants/colors.js
 * @doc docs/04-visual-factory.md (앵커 선택)
 */
import { GRADE_COLORS } from '../../../../shared/constants/colors.js'

// 생성 중인 활성 슬롯 — teal 테두리 + 스피너 + step progress bar
// progressPct >= 100 이면 GPU 완료 후 저장 중 상태로 전환
function LoadingCard({ slotIndex, progressPct }) {
  const isSaving = progressPct >= 100
  const hasMeasuredProgress = progressPct > 0 && progressPct < 100
  const barWidth = hasMeasuredProgress ? `${progressPct}%` : '0%'

  return (
    <div className="relative rounded-lg overflow-hidden ring-1 ring-teal-500/50 aspect-square bg-slate-800">
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-3">
        {isSaving ? (
          // GPU 완료 → 저장 중 (pulse 애니메이션으로 전환 명시)
          <>
            <div className="w-6 h-6 rounded-full border-2 border-teal-400 animate-ping opacity-70" />
            <div className="text-center text-xs text-teal-400 animate-pulse">저장 중...</div>
          </>
        ) : (
          // GPU steps 진행 중
          <>
            <svg className="w-6 h-6 animate-spin text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <div className="w-full space-y-1">
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${hasMeasuredProgress ? 'bg-teal-400' : 'bg-teal-400/70 animate-pulse'}`}
                  style={{ width: barWidth }}
                />
              </div>
              <div className="text-center text-xs text-slate-500 tabular-nums">
                {hasMeasuredProgress ? `${progressPct}%` : '진행 중...'}
              </div>
            </div>
          </>
        )}
      </div>
      {/* 인덱스 레이블 */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-xs text-teal-400">#{slotIndex + 1}</span>
      </div>
    </div>
  )
}

// 대기 중인 슬롯 — pulsing skeleton
function WaitingCard({ slotIndex }) {
  return (
    <div className="relative rounded-lg overflow-hidden ring-1 ring-slate-700/60 aspect-square bg-slate-800/60 animate-pulse">
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/40 to-transparent">
        <span className="text-xs text-slate-600">#{slotIndex + 1}</span>
      </div>
    </div>
  )
}

export default function CandidateImageCard({ candidate, displayIndex, isSelected, onSelect, variant = 'image', progressPct = 0, slotIndex = 0 }) {
  if (variant === 'loading') return <LoadingCard slotIndex={slotIndex} progressPct={progressPct} />
  if (variant === 'waiting') return <WaitingCard slotIndex={slotIndex} />

  const gradeColor = GRADE_COLORS[candidate.grade]

  return (
    <div
      onClick={() => onSelect(candidate)}
      className={`
        relative rounded-lg overflow-hidden cursor-pointer transition-all
        ${isSelected
          ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-slate-900'
          : 'ring-1 ring-slate-700 hover:ring-slate-500'
        }
      `}
    >
      {/* 이미지 */}
      <div className="aspect-square bg-slate-800">
        {candidate.image_url ? (
          <img
            src={candidate.image_url}
            alt={`후보 ${candidate.index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* 등급 뱃지 */}
      {gradeColor && (
        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-bold ${gradeColor.bg} ${gradeColor.text} border ${gradeColor.border}/50`}>
          {candidate.grade}
        </div>
      )}

      {/* 선택 체크 */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* 하단 인덱스 — displayIndex(그리드 위치) 우선, 없으면 candidate.index */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-xs text-slate-300">#{(displayIndex ?? candidate.index) + 1}</span>
      </div>
    </div>
  )
}
