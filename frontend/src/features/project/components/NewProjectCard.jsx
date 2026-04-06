/**
 * @file NewProjectCard.jsx
 * @description "새 프로젝트" 카드. 점선 테두리 + "+" 아이콘 + 설명 텍스트.
 * @usage ProjectListPage에서 카드 그리드 마지막에 표시.
 * @connects NewProjectModal.jsx (onClick으로 모달 열기)
 * @doc docs/01-project.md (새 프로젝트 생성)
 */

export default function NewProjectCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        border-2 border-dashed border-slate-600/60 rounded-xl
        flex flex-col items-center justify-center gap-3
        hover:border-slate-500 hover:bg-slate-800/20
        transition-colors cursor-pointer min-h-[380px]
      "
    >
      <span className="w-14 h-14 rounded-full border-2 border-slate-600 flex items-center justify-center text-2xl text-slate-500">
        +
      </span>
      <span className="text-base font-semibold text-white font-[family-name:var(--font-headline)]">
        새 프로젝트
      </span>
      <span className="text-xs text-slate-500 text-center leading-relaxed px-8">
        AI 스토리 오케스트레이션을 시작하려면<br />
        클릭하여 대본을 업로드하세요.
      </span>
    </button>
  )
}
