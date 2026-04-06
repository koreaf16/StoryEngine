/**
 * @file CopyButton.jsx
 * @description 클립보드 복사 버튼. 복사 성공 시 "복사됨!" 피드백 표시.
 * @usage PromptCopyPaste 패턴에서 프롬프트 텍스트 복사 시 사용.
 * @connects shared/hooks/useClipboard.js
 */
import { useState } from 'react'
import { logError } from '../../utils/logger.js'

export default function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      logError('CopyButton.copy', error, { hasText: Boolean(text) })
      /* fallback: 조용히 실패 */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`
        px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer
        ${copied
          ? 'bg-teal-600/20 border-teal-600 text-teal-400'
          : 'bg-slate-700 border-slate-600 text-slate-300 hover:text-white hover:border-slate-500'
        }
        ${className}
      `}
    >
      {copied ? '복사됨!' : '복사'}
    </button>
  )
}
