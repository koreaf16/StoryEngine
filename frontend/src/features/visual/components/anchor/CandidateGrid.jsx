/**
 * @file CandidateGrid.jsx
 * @description 앵커 후보 이미지 4열 그리드 래퍼.
 * 생성 중일 때 totalCount만큼 슬롯을 미리 표시하고,
 * 완료된 이미지부터 순서대로 채워넣는다.
 * 첫 번째 미완료 슬롯(active)에는 step progress bar를 표시.
 * @usage AnchorSelectPage에서 후보 이미지 목록 표시 시 사용.
 * @connects CandidateImageCard
 * @doc docs/04-visual-factory.md (앵커 선택)
 */
import CandidateImageCard from './CandidateImageCard.jsx'

export default function CandidateGrid({
  candidates,
  selectedIndex,
  onSelect,
  totalCount = 0,
  isGenerating = false,
  progressPct = 0,
}) {
  const completedCount = candidates?.length ?? 0
  const slotCount = Math.max(completedCount, isGenerating ? totalCount : 0)

  if (slotCount === 0 && completedCount === 0) return null

  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: slotCount }, (_, i) => {
        // 완료된 슬롯: 실제 이미지 카드
        if (i < completedCount) {
          const candidate = candidates[i]
          return (
            <CandidateImageCard
              key={candidate.image_id ?? candidate.index}
              candidate={candidate}
              displayIndex={i}
              isSelected={selectedIndex === candidate.index}
              onSelect={onSelect}
            />
          )
        }
        // 활성 슬롯: 현재 생성 중 (첫 번째 미완료)
        if (i === completedCount && isGenerating) {
          return (
            <CandidateImageCard
              key={`active-${i}`}
              variant="loading"
              slotIndex={i}
              progressPct={progressPct}
            />
          )
        }
        // 대기 슬롯: pulsing skeleton
        return (
          <CandidateImageCard
            key={`waiting-${i}`}
            variant="waiting"
            slotIndex={i}
          />
        )
      })}
    </div>
  )
}
