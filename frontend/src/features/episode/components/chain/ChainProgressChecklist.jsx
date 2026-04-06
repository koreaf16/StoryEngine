/**
 * @file ChainProgressChecklist.jsx
 * @description Chain 1~5 진행 상태 체크리스트. 현재 단계 강조, 완료/대기/SKIP 표시.
 * @usage ChainDesignPage에서 사용.
 * @connects features/episode/pages/ChainDesignPage.jsx
 * @doc docs/05-episode.md (Chain 2~5 진행 흐름)
 */

const CHAINS = [
  { key: 'CHAIN1', label: 'Chain 1 — 소설', desc: '자유 산문 완료' },
  { key: 'CHAIN2', label: 'Chain 2 — 씬·샷 설계', desc: '씬 분할 + 샷 리스트' },
  { key: 'CHAIN3', label: 'Chain 3 — 사운드', desc: 'SKIP (구현 예정)', skip: true },
  { key: 'CHAIN4', label: 'Chain 4 — 이미지 프롬프트', desc: '5블록 Flux 프롬프트' },
  { key: 'CHAIN5', label: 'Chain 5 — 영상 프롬프트', desc: 'Wan2.2 I2V 프롬프트' },
]

const PHASE_ORDER = ['CHAIN1', 'CHAIN2', 'CHAIN3', 'CHAIN4', 'CHAIN5']

function getStatus(chainKey, currentPhase) {
  if (chainKey === 'CHAIN3') return 'skip'
  if (chainKey === 'CHAIN1') return 'done'
  const chainIdx = PHASE_ORDER.indexOf(chainKey)
  const currentIdx = PHASE_ORDER.indexOf(currentPhase)
  if (chainIdx < currentIdx) return 'done'
  if (chainIdx === currentIdx) return 'active'
  return 'pending'
}

export default function ChainProgressChecklist({ phase }) {
  return (
    <div className="flex flex-col gap-1.5">
      {CHAINS.map((chain) => {
        const status = getStatus(chain.key, phase)
        return (
          <div
            key={chain.key}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              status === 'active' ? 'bg-teal-500/10 border border-teal-500/30' :
              status === 'done' ? 'bg-slate-800/50' :
              status === 'skip' ? 'bg-slate-800/30 opacity-50' :
              'bg-slate-800/30 opacity-40'
            }`}
          >
            <span className={`w-4 h-4 shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold ${
              status === 'done' ? 'bg-teal-500 text-white' :
              status === 'active' ? 'bg-teal-500/30 text-teal-300 border border-teal-500' :
              status === 'skip' ? 'bg-slate-600 text-slate-400' :
              'bg-slate-700 text-slate-500'
            }`}>
              {status === 'done' ? '✓' : status === 'skip' ? '—' : '·'}
            </span>
            <span className={`font-medium ${
              status === 'active' ? 'text-teal-300' :
              status === 'done' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              {chain.label}
            </span>
            <span className="text-slate-500 text-xs ml-auto">{chain.desc}</span>
          </div>
        )
      })}
    </div>
  )
}
