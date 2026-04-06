/**
 * @file TabSelector.jsx
 * @description "LLM으로 생성" / "직접 입력" 2탭 토글 셀렉터.
 * @usage CharacterPromptPage.jsx 상단에서 입력 방식 전환.
 * @connects features/character/pages/CharacterPromptPage.jsx
 * @doc docs/03-character-setup.md (설정 방식)
 */

export default function TabSelector({ activeTab, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 w-fit">
      <button
        onClick={() => onChange('llm')}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'llm'
            ? 'bg-teal-500/20 text-teal-400'
            : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        LLM으로 생성
      </button>
      <button
        onClick={() => onChange('direct')}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          activeTab === 'direct'
            ? 'bg-teal-500/20 text-teal-400'
            : 'text-slate-400 hover:text-slate-300'
        }`}
      >
        직접 입력
      </button>
    </div>
  )
}
