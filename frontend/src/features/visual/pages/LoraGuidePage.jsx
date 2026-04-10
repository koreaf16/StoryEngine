/**
 * @file LoraGuidePage.jsx
 * @description Kohya-ss 기반 Flux 2 LoRA 자동 학습 제어 및 시각화 페이지 (파싱 및 중지 기능 강화).
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useProjectStore from '../../../store/useProjectStore.js'
import { startLoraTraining, stopLoraTraining, getLoraTrainingStatus, linkManualLora } from '../../../services/visual/loraApi.js'
import { logError } from '../../../shared/utils/logger.js'

function parseProgress(log) {
  if (!log) return null
  const lines = log.split(/[\n\r]+/).reverse()
  const lastLine = lines.find(l => l.includes('steps:'))
  if (!lastLine) return null
  const match = lastLine.match(/steps:\s*(\d+)%\|.*?\|\s*(\d+)\/(\d+)\s+\[(.*?)\s*<\s*(.*?),\s*(.*?)s\/it.*?avr_loss=(.*?)\]/)
  if (!match) {
    const simpleMatch = lastLine.match(/steps:\s*(\d+)%\|.*?\|\s*(\d+)\/(\d+)/)
    if (simpleMatch) return { percent: parseInt(simpleMatch[1], 10), current: simpleMatch[2], total: simpleMatch[3], time: '', speed: '', loss: '---' }
    return null
  }
  return { percent: parseInt(match[1], 10), current: match[2], total: match[3], elapsed: match[4], remaining: match[5], speed: match[6], loss: match[7].trim() }
}

function cleanLogs(log) {
  if (!log) return ''
  return log.split(/[\n\r]+/).filter(line => {
    const l = line.trim()
    if (!l || l.startsWith('steps:')) return false
    if (l.includes('huggingface/tokenizers')) return false
    return true
  }).join('\n')
}

export default function LoraGuidePage() {
  const { id, assetId } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const fetchProjectDetail = useProjectStore((s) => s.fetchProjectDetail)
  const asset = project?.assets?.find((a) => a.asset_id === assetId)

  const [loraFilename, setLoraFilename] = useState('')
  const [triggerWord, setTriggerWord] = useState(asset?.display_name || 'char')
  const [rawLog, setRawLog] = useState('')
  const [trainingStatus, setTrainingStatus] = useState('idle')
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState(null)
  
  const logEndRef = useRef(null)
  const progress = useMemo(() => parseProgress(rawLog), [rawLog])
  const cleanedLog = useMemo(() => cleanLogs(rawLog), [rawLog])

  useEffect(() => {
    async function syncStatus() {
      try {
        const data = await getLoraTrainingStatus(assetId)
        if (data.status === 'running' || data.status === 'done') {
          setTrainingStatus(data.status)
          setRawLog(data.log)
          if (data.lora_name) setLoraFilename(`${data.lora_name}.safetensors`)
        }
      } catch (err) { /* ignore */ }
    }
    syncStatus()
  }, [assetId])

  useEffect(() => {
    let timer
    if (trainingStatus === 'running') {
      timer = setInterval(async () => {
        try {
          const data = await getLoraTrainingStatus(assetId)
          setRawLog(data.log)
          if (data.status === 'done') setTrainingStatus('done')
        } catch (err) { console.error(err) }
      }, 3000)
    }
    return () => clearInterval(timer)
  }, [assetId, trainingStatus])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [cleanedLog])

  if (!asset) return <div className="p-6 text-slate-500">에셋을 찾을 수 없습니다.</div>

  async function handleStartAutoTraining() {
    setTrainingStatus('running')
    setRawLog('명령 전송 중...\n')
    setError(null)
    try {
      await startLoraTraining(assetId, triggerWord)
    } catch (err) {
      logError('LoraGuide.train', err)
      setError(err.message)
      setTrainingStatus('idle')
    }
  }

  async function handleStopTraining() {
    if (!window.confirm('진행 중인 학습을 중단하고 VRAM을 정리하시겠습니까?')) return
    try {
      await stopLoraTraining(assetId)
      setTrainingStatus('idle')
      setRawLog(prev => prev + '\n--- 학습이 사용자에 의해 중단되었습니다. ---\n')
    } catch (err) {
      logError('LoraGuide.stop', err)
      alert('중단 실패: ' + err.message)
    }
  }

  async function handleLink() {
    if (!loraFilename) return
    setIsLinking(true)
    try {
      await linkManualLora(assetId, loraFilename, triggerWord)
      await fetchProjectDetail(id)
      navigate(`/project/${id}/visual/${assetId}/gallery`)
    } catch (err) {
      logError('LoraGuide.link', err)
      setError(err.message)
    } finally { setIsLinking(false) }
  }

  return (
    <div className="max-w-4xl p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">{asset.display_name} — LoRA 학습</h1>
          <p className="mt-1 text-sm text-slate-400">안정화 터보 모드 (Batch Size: 5)</p>
        </div>
        {progress && (
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loss</div>
            <div className="text-2xl font-mono font-bold text-teal-400 leading-none">{progress.loss}</div>
          </div>
        )}
      </div>

      {trainingStatus === 'running' && progress && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 text-xl font-bold font-mono">{progress.percent}%</div>
              <div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Progress</div>
                <div className="text-sm text-slate-200 font-mono">{progress.current} / {progress.total} steps</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Est. Remaining</div>
              <div className="text-sm text-slate-200 font-mono">{progress.remaining || '--:--'}</div>
            </div>
          </div>
          <div className="relative h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-1000 ease-out" style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
            <span>Server: GPU 2 (A100)</span>
            <span>Speed: {progress.speed}s/it</span>
          </div>
        </div>
      )}

      <section className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[350px] shadow-inner">
        <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Events</h2>
          <span className="text-[10px] text-teal-500 font-mono uppercase">{trainingStatus}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] text-slate-400 leading-relaxed">
          {cleanedLog || 'Waiting for system messages...'}
          {trainingStatus === 'running' && <div className="mt-3 text-teal-500/60 italic animate-pulse flex items-center gap-2"><span className="w-1 h-1 bg-teal-500 rounded-full" />학습이 정상적으로 진행되고 있습니다...</div>}
          <div ref={logEndRef} />
        </div>
      </section>

      <div className="flex gap-3">
        {trainingStatus === 'running' ? (
          <button onClick={handleStopTraining} className="flex-1 py-4 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold transition-all border border-red-500/30 flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            학습 강제 중지 및 VRAM 정리
          </button>
        ) : (
          <button onClick={handleStartAutoTraining} className="flex-1 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            LoRA 자동 학습 시작
          </button>
        )}
      </div>

      {(trainingStatus === 'done' || (trainingStatus === 'idle' && asset.lora_path)) && (
        <section className="bg-teal-500/5 rounded-2xl border border-teal-500/20 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2"><span className="w-2 h-2 bg-teal-500 rounded-full" /> 학습 결과 등록</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><label className="text-[10px] text-slate-500 font-bold uppercase">Filename</label><input type="text" value={loraFilename} onChange={(e) => setLoraFilename(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-teal-400 font-mono focus:border-teal-500 outline-none" /></div>
            <div className="space-y-1"><label className="text-[10px] text-slate-500 font-bold uppercase">Trigger Word</label><input type="text" value={triggerWord} onChange={(e) => setTriggerWord(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-teal-500 outline-none" /></div>
          </div>
          <button onClick={handleLink} disabled={isLinking || !loraFilename} className="w-full py-3 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-bold transition-all">{isLinking ? '등록 중...' : 'LoRA 에셋으로 최종 확정 →'}</button>
        </section>
      )}
    </div>
  )
}
