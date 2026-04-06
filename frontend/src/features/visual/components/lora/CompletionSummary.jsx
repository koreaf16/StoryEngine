/**
 * @file CompletionSummary.jsx
 * @description LoRA 학습 완료 결과 카드. 트리거 워드, 학습 이미지 수, 스텝 수 표시.
 * @usage LoraCompletePage에서 학습 완료 결과 표시 시 사용.
 * @connects LoraCompletePage
 * @doc docs/04-visual-factory.md (LoRA 완료)
 */

export default function CompletionSummary({ loraResult, assetName }) {
  if (!loraResult) return null

  const stats = [
    { label: '트리거 워드', value: loraResult.trigger_word },
    { label: '학습 이미지', value: `${loraResult.training_images}장` },
    { label: '학습 스텝', value: `${loraResult.steps?.toLocaleString()}` },
    { label: '모델 경로', value: loraResult.model_path, mono: true },
  ]

  return (
    <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-teal-100">{assetName} LoRA 학습 완료</div>
          <div className="text-xs text-teal-500/80 mt-0.5">이 에셋은 이제 LoRA 전략으로 고품질 이미지를 생성할 수 있습니다</div>
        </div>
      </div>

      {/* 스탯 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-800/60 rounded-lg px-3 py-2.5">
            <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
            <div className={`text-sm text-slate-200 ${stat.mono ? 'font-mono text-xs' : 'font-medium'} break-all`}>
              {stat.value ?? '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
