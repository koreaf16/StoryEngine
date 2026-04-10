/**
 * @file DerivedImagesFlowSections.jsx
 * @description Presentational sections for the clean derived-images flow page.
 * @usage Imported by DerivedImagesFlowPage.jsx.
 * @connects frontend/src/features/visual/pages/DerivedImagesFlowPage.jsx
 * @doc docs/04-visual-factory.md
 */
function FilterBadge({ result }) {
  if (!result) return null

  const styles = {
    PASS: 'border-green-500/30 bg-green-500/15 text-green-300',
    FAIL: 'border-red-500/30 bg-red-500/15 text-red-300',
    SKIP: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300',
  }

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[result] ?? styles.SKIP}`}>
      {result}
    </span>
  )
}

export function StatusPanel({ queue, progress, progressPct, wsConnected, completed, total }) {
  const hasMeasuredProgress = progress.max > 0
  const stepWidth = hasMeasuredProgress ? `${progressPct}%` : '0%'

  return (
    <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Generating derived images</span>
          <span className="tabular-nums text-slate-400">{completed} / {total || 1}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-teal-500 transition-all duration-300"
            style={{ width: `${total > 0 ? Math.round((completed / total) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-2">
            <span>ComfyUI queue</span>
            {wsConnected !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded normal-case tracking-normal ${wsConnected ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                WS {wsConnected ? 'ON' : 'OFF'}
              </span>
            )}
          </div>
          <span>{hasMeasuredProgress ? `${progressPct}% current step` : 'Waiting for step progress'}</span>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm text-slate-300">
          <span>Running: <span className="font-semibold text-green-400">{queue.running}</span></span>
          <span>Pending: <span className="font-semibold text-yellow-400">{queue.pending}</span></span>
          <span>Step: <span className="font-semibold text-teal-300">{progress.value}/{progress.max}</span></span>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${hasMeasuredProgress ? 'bg-teal-400' : 'bg-teal-400/70 animate-pulse'}`}
              style={{ width: stepWidth }}
            />
          </div>
          <div className="text-right text-xs tabular-nums text-slate-500">
            {hasMeasuredProgress ? `${progressPct}%` : '진행 중...'}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ImageSection({ category, images, selectedPresets, onToggleSelection }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-200">{category}</h2>
        <span className="text-xs text-slate-500">{images.length} images</span>
        <div className="h-px flex-1 bg-slate-700/60" />
      </div>
      <div className="grid grid-cols-4 gap-2 xl:grid-cols-5">
        {images.map((image) => {
          const isSelected = image.preset_key ? selectedPresets.includes(image.preset_key) : false

          return (
            <article
              key={image.image_id ?? image.preset_name}
              onClick={() => image.preset_key && onToggleSelection(image.preset_key)}
              className={`relative cursor-pointer overflow-hidden rounded-lg ring-2 transition-all ${
                isSelected ? 'ring-teal-500' : 'ring-slate-700 hover:ring-slate-500'
              }`}
            >
              <div className="aspect-square bg-slate-900">
                <img src={image.image_url} alt={image.preset_name ?? 'Derived'} className="h-full w-full object-cover" />
              </div>
              {/* 선택 체크 */}
              {isSelected && (
                <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 shadow">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {/* 탈락 오버레이 */}
              {image.filter_result === 'FAIL' && (
                <div className="absolute inset-0 bg-red-900/30 pointer-events-none" />
              )}
              {/* 하단 레이블 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 py-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[10px] text-slate-300">{image.preset_name}</span>
                  <FilterBadge result={image.filter_result} />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
