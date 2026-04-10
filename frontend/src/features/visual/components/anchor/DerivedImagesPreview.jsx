/**
 * @file DerivedImagesPreview.jsx
 * @description 앵커 선택 페이지에서 기존 파생 이미지를 접이식으로 미리보기.
 * @usage AnchorSelectPage에서 파생 이미지가 있을 때 표시.
 * @connects AnchorSelectPage.jsx
 * @doc docs/04-visual-factory.md
 */
import { useState } from 'react'

export default function DerivedImagesPreview({ images }) {
  const [open, setOpen] = useState(false)
  if (!images?.length) return null

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:text-slate-100 transition-colors">
        <span>파생 이미지 미리보기 ({images.length}장)</span>
        <svg className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-6 gap-1.5">
          {images.map((img) => (
            <div key={img.image_id} className="relative aspect-square overflow-hidden rounded-lg border border-slate-700 group">
              <img src={img.image_url} alt={img.preset_name} className="h-full w-full object-cover" loading="lazy" />
              {img.preset_name && (
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[9px] text-slate-300 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.preset_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
