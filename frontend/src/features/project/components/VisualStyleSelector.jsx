/**
 * @file VisualStyleSelector.jsx
 * @description 프로젝트 비주얼 스타일 선택 카드 그리드. 포토리얼/카툰/애니메/3D 중 택 1.
 * @usage NewProjectModal에서 사용.
 * @connects shared/constants/badgeConfig.js (VISUAL_STYLE_LABELS)
 * @doc docs/01-project.md
 */

const STYLES = [
  {
    key: 'PHOTOREALISTIC',
    label: '포토리얼',
    desc: '실사 기반 영상',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
      </svg>
    ),
    ring: 'ring-amber-500',
    border: 'border-amber-500/60',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
  },
  {
    key: 'CARTOON',
    label: '카툰',
    desc: '만화·일러스트 스타일',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
      </svg>
    ),
    ring: 'ring-pink-500',
    border: 'border-pink-500/60',
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
  },
  {
    key: 'ANIME',
    label: '애니메이션',
    desc: '일본 애니메 스타일',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    ring: 'ring-violet-500',
    border: 'border-violet-500/60',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
  },
  {
    key: '3D_RENDER',
    label: '3D 렌더',
    desc: '3D CG 렌더링',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    ring: 'ring-cyan-500',
    border: 'border-cyan-500/60',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
  },
]

export default function VisualStyleSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {STYLES.map((style) => {
        const selected = value === style.key
        return (
          <button
            key={style.key}
            type="button"
            onClick={() => onChange(style.key)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
              selected
                ? `${style.border} ${style.bg} ring-1 ${style.ring}`
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className={`shrink-0 ${selected ? style.text : 'text-slate-500'}`}>
              {style.icon}
            </div>
            <div className="min-w-0">
              <div className={`text-sm font-semibold ${selected ? style.text : 'text-slate-300'}`}>
                {style.label}
              </div>
              <div className="text-xs text-slate-500 truncate">{style.desc}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
