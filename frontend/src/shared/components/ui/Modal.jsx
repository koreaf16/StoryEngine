/**
 * @file Modal.jsx
 * @description 범용 모달 오버레이. 제목 + 본문 + 하단 버튼 구조.
 * @usage NewProjectModal 등 모달이 필요한 곳에서 래핑.
 * @connects 없음 (독립 UI 컴포넌트)
 */

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {title && (
          <h3 className="text-lg font-semibold text-white mb-4 font-[family-name:var(--font-headline)]">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  )
}
