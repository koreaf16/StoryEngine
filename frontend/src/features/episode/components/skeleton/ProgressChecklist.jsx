/**
 * @file ProgressChecklist.jsx
 * @description 골격/대본/샷/사운드 생성 진행 체크리스트. D → D2 → E(씬별) → F(씬별) 단계 표시.
 * @usage SkeletonPromptPage.jsx 상단.
 * @connects features/episode/pages/SkeletonPromptPage.jsx
 * @doc docs/05-episode.md (4단계 생성)
 */

function StepItem({ label, status, indent = false }) {
  const isComplete = status === 'complete'
  const isActive = status === 'active'
  const isSkipped = status === 'skipped'

  return (
    <div className={`flex items-center gap-3 py-1.5 ${indent ? 'ml-6' : ''}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
        isComplete ? 'bg-teal-500'
        : isActive ? 'border-2 border-teal-500'
        : isSkipped ? 'border-2 border-slate-600 bg-slate-700'
        : 'border-2 border-slate-600'
      }`}>
        {isComplete && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
        {isSkipped && <div className="w-2 h-0.5 bg-slate-500" />}
      </div>

      <span className={`text-sm ${
        isComplete ? 'text-slate-500 line-through'
        : isActive ? 'text-white font-medium'
        : isSkipped ? 'text-slate-600 line-through'
        : 'text-slate-500'
      }`}>
        {label}
      </span>
      {isSkipped && <span className="text-xs text-slate-600 font-mono">SKIP</span>}
    </div>
  )
}

export default function ProgressChecklist({ phase, scenes, scriptDone, currentSceneIndex }) {
  const skeletonDone = scenes.length > 0

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">생성 진행</h4>

      <StepItem
        label="골격 (D)"
        status={skeletonDone ? 'complete' : phase === 'SKELETON' ? 'active' : 'pending'}
      />

      <StepItem
        label="대본 (D2)"
        status={scriptDone ? 'complete' : phase === 'SCRIPT' ? 'active' : skeletonDone ? 'pending' : 'pending'}
      />

      {scenes.map((scene, i) => {
        const shotsDone = scene.shots?.length > 0
        const shotStatus = shotsDone
          ? 'complete'
          : (phase === 'SHOTS' && i === currentSceneIndex && scriptDone) ? 'active'
          : 'pending'

        return (
          <div key={scene.scene_number}>
            <StepItem
              label={`씬 ${scene.scene_number} 샷 (E) — ${scene.title}`}
              status={shotStatus}
              indent
            />
            <StepItem
              label={`씬 ${scene.scene_number} 사운드 (F)`}
              status="skipped"
              indent
            />
          </div>
        )
      })}
    </div>
  )
}
