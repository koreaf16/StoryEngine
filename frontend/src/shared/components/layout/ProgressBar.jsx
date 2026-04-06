/**
 * @file ProgressBar.jsx
 * @description 4단계 진행 바. 대본→캐릭터→외형→에피소드 단계 표시.
 * @usage Layout.jsx 하단에 항상 렌더링 (프로젝트 내부 페이지에서만).
 * @connects 없음 (props로 현재 단계 받음)
 * @doc docs/00-overview.md (4단계 직선 흐름), docs/10-ui-spec.md (진행 바)
 */

const STEPS = [
  { key: 'script', label: '1. 대본' },
  { key: 'character', label: '2. 캐릭터' },
  { key: 'visual', label: '3. 외형' },
  { key: 'episode', label: '4. 에피소드' },
]

export default function ProgressBar({ currentStep = 'script', completedSteps = [] }) {
  return (
    <nav className="flex items-center border-t border-slate-700 bg-slate-900/80">
      {STEPS.map((step) => {
        const isActive = step.key === currentStep
        const isCompleted = completedSteps.includes(step.key)

        let borderColor = 'border-transparent'
        let textStyle = 'text-slate-500'

        if (isActive) {
          borderColor = 'border-white'
          textStyle = 'text-white font-bold'
        } else if (isCompleted) {
          borderColor = 'border-green-500'
          textStyle = 'text-slate-400'
        }

        return (
          <div
            key={step.key}
            className={`flex-1 text-center py-3 text-sm border-b-2 ${borderColor} ${textStyle} transition-colors`}
          >
            {step.label}
          </div>
        )
      })}
    </nav>
  )
}
