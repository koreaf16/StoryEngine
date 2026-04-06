/**
 * @file PhotoUpload.jsx
 * @description 앵커 이미지 직접 업로드 컴포넌트.
 * @usage AnchorSelectPage에서 '사진 업로드' 모드일 때 렌더링.
 */
import { useRef, useMemo, useEffect } from 'react'

export default function PhotoUpload({ file, onFileChange, isGenerating }) {
  const fileInputRef = useRef(null)
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileChange(selectedFile)
    }
    e.target.value = ''
  }

  if (file && previewUrl) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">참조 사진</h2>
        <div className="relative group aspect-square max-w-sm mx-auto overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          <img src={previewUrl} alt="참조 사진" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              className="p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => onFileChange(null)}
              disabled={isGenerating}
              className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        <p className="text-xs text-center text-slate-500">
          이 사진의 얼굴 identity를 Flux 모델에 주입하여 이미지를 생성합니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => !isGenerating && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer
          ${isGenerating
            ? 'bg-slate-800/50 border-slate-700 cursor-not-allowed'
            : 'bg-slate-800 border-slate-700 hover:border-teal-500/50 hover:bg-slate-700/50'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isGenerating}
        />
        <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-200">클릭하여 참조 사진 업로드</p>
          <p className="text-xs text-slate-500 mt-1">PNG, JPG (최대 10MB)</p>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        * 업로드한 이미지의 얼굴을 기반으로 세계관에 어울리는 캐릭터 이미지를 생성합니다.
      </p>
    </div>
  )
}
