/**
 * @file AppearancePromptEditor.jsx
 * @description 캐릭터 외모 프롬프트 편집 textarea. 저장 버튼 포함.
 * @usage AnchorSelectPage에서 외모 프롬프트 편집 시 사용.
 * @connects AnchorSelectPage, store/useProjectStore.js
 * @doc docs/04-visual-factory.md (앵커 생성)
 */
import { useState, useEffect } from 'react'

export default function AppearancePromptEditor({ value, onChange, onSave }) {
  const [draft, setDraft] = useState(value)

  // value prop이 외부에서 변경되면 draft 동기화 (초기 로딩 시 필요)
  useEffect(() => {
    setDraft(value)
  }, [value])

  const isDirty = draft !== value

  const handleChange = (e) => {
    const newVal = e.target.value
    setDraft(newVal)
    if (onChange) {
      onChange(newVal)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          외모 프롬프트 (영문)
        </label>
        {isDirty && (
          <button
            onClick={() => onSave(draft)}
            className="text-xs px-2 py-1 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors"
          >
            저장
          </button>
        )}
      </div>
      <textarea
        value={draft}
        onChange={handleChange}
        rows={4}
        className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-teal-500/50 focus:outline-none text-sm text-slate-200 font-mono resize-none placeholder-slate-600"
        placeholder="Describe the character's appearance in English..."
      />
      <p className="text-xs text-slate-600">
        영문으로 작성하면 이미지 생성 품질이 높아집니다.
      </p>
    </div>
  )
}
