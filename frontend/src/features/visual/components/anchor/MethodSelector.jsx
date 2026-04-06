/**
 * @file MethodSelector.jsx
 * @description 앵커 생성 방법 선택 라디오 카드 (텍스트 프롬프트 / 사진 업로드).
 * @usage AnchorSelectPage에서 앵커 생성 방법 선택 시 사용.
 * @connects AnchorSelectPage
 * @doc docs/04-visual-factory.md (앵커 생성 방법)
 */

const METHODS = [
  {
    key: 'TEXT',
    label: '텍스트 프롬프트',
    description: '외모 설명을 기반으로 AI가 이미지 생성',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    key: 'PHOTO',
    label: '사진 업로드',
    description: '참고 사진을 업로드하여 앵커 이미지로 사용',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function MethodSelector({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {METHODS.map((method) => {
        const isSelected = value === method.key
        return (
          <button
            key={method.key}
            onClick={() => onChange(method.key)}
            className={`
              flex-1 flex items-start gap-3 p-4 rounded-lg border text-left transition-colors cursor-pointer
              ${isSelected
                ? 'bg-teal-500/10 border-teal-500/50 text-teal-100'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
              }
            `}
          >
            <div className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`}>
              {method.icon}
            </div>
            <div>
              <div className={`text-sm font-medium ${isSelected ? 'text-teal-100' : 'text-slate-200'}`}>
                {method.label}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{method.description}</div>
            </div>
            <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${
              isSelected ? 'border-teal-400 bg-teal-400' : 'border-slate-600'
            }`} />
          </button>
        )
      })}
    </div>
  )
}
