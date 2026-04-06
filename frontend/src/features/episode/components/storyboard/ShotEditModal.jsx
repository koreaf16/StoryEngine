/**
 * @file ShotEditModal.jsx
 * @description 샷 편집 모달. 대사/카메라/전환/시간 수정.
 * @usage StoryboardPage.jsx에서 ShotCard 수정 버튼 클릭 시 표시.
 * @connects shared/components/ui/Modal.jsx, shared/components/ui/Button.jsx
 * @doc docs/05-episode.md (편집 기능)
 */
import { useState } from 'react'
import Modal from '../../../../shared/components/ui/Modal.jsx'
import Button from '../../../../shared/components/ui/Button.jsx'
import { CAMERA_MOTIONS, TRANSITIONS } from '../../constants/episodeStatus.js'

export default function ShotEditModal({ shot, onSave, onClose }) {
  const [form, setForm] = useState({
    camera_motion: shot.camera_motion,
    duration_sec: shot.duration_sec,
    transition: shot.transition,
    render_prompt: shot.render_prompt,
    video_prompt: shot.video_prompt || '',
    dialogues: shot.dialogues || [],
  })

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const updateDialogue = (idx, field, value) => {
    const next = form.dialogues.map((d, i) => i === idx ? { ...d, [field]: value } : d)
    update('dialogues', next)
  }

  return (
    <Modal isOpen onClose={onClose} title={`샷 #${shot.shot_number} 수정`}>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {/* 카메라/시간/전환 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500">카메라</label>
            <select value={form.camera_motion} onChange={(e) => update('camera_motion', e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-300">
              {CAMERA_MOTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">시간 (초)</label>
            <input type="number" min={1} max={15} value={form.duration_sec}
              onChange={(e) => update('duration_sec', Number(e.target.value))}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-300" />
          </div>
          <div>
            <label className="text-xs text-slate-500">전환</label>
            <select value={form.transition} onChange={(e) => update('transition', e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-300">
              {TRANSITIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* 렌더 프롬프트 */}
        <div>
          <label className="text-xs text-slate-500">렌더 프롬프트 (이미지)</label>
          <textarea value={form.render_prompt} onChange={(e) => update('render_prompt', e.target.value)}
            rows={3} className="w-full mt-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 resize-none font-mono" />
        </div>

        {/* 영상 프롬프트 */}
        <div>
          <label className="text-xs text-purple-400">영상 프롬프트 (Wan2.2 I2V)</label>
          <textarea value={form.video_prompt} onChange={(e) => update('video_prompt', e.target.value)}
            rows={2} placeholder="camera slowly dolly in, character breathes..."
            className="w-full mt-1 bg-slate-900 border border-purple-500/30 rounded p-2 text-sm text-slate-300 resize-none font-mono" />
        </div>

        {/* 대사 */}
        {form.dialogues.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs text-slate-500">대사</label>
            {form.dialogues.map((d, i) => (
              <div key={i} className="flex gap-2">
                <input value={d.speaker_asset} onChange={(e) => updateDialogue(i, 'speaker_asset', e.target.value)}
                  className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-teal-400 font-mono" placeholder="화자" />
                <input value={d.text} onChange={(e) => updateDialogue(i, 'text', e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300" placeholder="대사" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="ghost" onClick={onClose}>취소</Button>
        <Button onClick={() => onSave({ ...shot, ...form })}>저장</Button>
      </div>
    </Modal>
  )
}
