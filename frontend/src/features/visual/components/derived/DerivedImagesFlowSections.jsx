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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {images.map((image) => {
          const isSelected = image.preset_key ? selectedPresets.includes(image.preset_key) : false

          return (
            <article key={image.image_id ?? image.preset_name} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80">
              <div className="aspect-square bg-slate-900">
                <img src={image.image_url} alt={image.preset_name ?? 'Derived'} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-100">{image.preset_name || 'Derived image'}</div>
                    {image.face_distance !== null && image.face_distance !== undefined && (
                      <div className="mt-1 text-xs text-slate-500">Distance: {Number(image.face_distance).toFixed(3)}</div>
                    )}
                  </div>
                  <FilterBadge result={image.filter_result} />
                </div>
                <button
                  type="button"
                  onClick={() => image.preset_key && onToggleSelection(image.preset_key)}
                  disabled={!image.preset_key}
                  className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'border-teal-500/40 bg-teal-500/15 text-teal-200'
                      : 'border-slate-600 bg-slate-900/30 text-slate-300 hover:border-slate-500'
                  } disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500`}
                >
                  {isSelected ? 'Selected for regenerate' : 'Select for regenerate'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
