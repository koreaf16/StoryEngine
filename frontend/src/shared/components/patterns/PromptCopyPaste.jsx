/**
 * @file PromptCopyPaste.jsx
 * @description 프롬프트 복사/붙여넣기 루프 UI 패턴. 상단=프롬프트 표시+복사, 하단=응답 붙여넣기.
 * @usage PromptAPage, PromptBPage, 캐릭터 프롬프트 등 LLM 연동 화면에서 반복 사용.
 * @connects shared/components/ui/CopyButton.jsx, shared/components/ui/Button.jsx
 * @doc docs/10-ui-spec.md (공통 UI 패턴 — 프롬프트 복사/붙여넣기 루프)
 */
import { useState } from 'react'
import CopyButton from '../ui/CopyButton.jsx'
import Button from '../ui/Button.jsx'

export default function PromptCopyPaste({
  title,
  description,
  promptText,
  initialResponse = '',
  pasteLabel = 'LLM 응답을 여기에 붙여넣으세요',
  submitLabel = '제출 →',
  onSubmit,
}) {
  const [response, setResponse] = useState(() => initialResponse)

  const handleSubmit = () => {
    if (response.trim()) {
      onSubmit(response.trim())
    }
  }

  return (
    <div className="space-y-6">
      {/* 프롬프트 표시 영역 */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          <CopyButton text={promptText} />
        </div>
        <pre className="p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
          {promptText}
        </pre>
      </div>

      {/* 응답 붙여넣기 영역 */}
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-1">
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder={pasteLabel}
          rows={8}
          className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-500 resize-y outline-none p-3 min-h-[120px]"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!response.trim()}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
