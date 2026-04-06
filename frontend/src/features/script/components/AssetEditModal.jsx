import { useState, useEffect } from 'react'
import Modal from '../../../shared/components/ui/Modal.jsx'
import Button from '../../../shared/components/ui/Button.jsx'
import { ASSET_TYPE_LABELS } from '../../../shared/constants/badgeConfig.js'

export default function AssetEditModal({ isOpen, onClose, asset, onSave }) {
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isOpen && asset) {
      setDraft({ ...asset })
    } else {
      setDraft(null)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, asset])

  if (!isOpen || !draft) return null

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  const handleChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="에셋 수정">
      <div className="space-y-4">
        {/* 이름 */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">표시명</label>
          <input
            type="text"
            value={draft.display_name || ''}
            onChange={(e) => handleChange('display_name', e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500/50"
          />
        </div>

        {/* 에셋 타입 & 시각 전략 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">에셋 타입</label>
            <select
              value={draft.asset_type || 'CHARACTER'}
              onChange={(e) => handleChange('asset_type', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500/50"
            >
              {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">시각 전략</label>
            <select
              value={draft.visual_strategy || 'PROMPT'}
              onChange={(e) => handleChange('visual_strategy', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500/50"
            >
              <option value="PROMPT">PROMPT (텍스트 의존)</option>
              <option value="LORA">LORA (모델 학습)</option>
            </select>
          </div>
        </div>

        {/* 주인공 여부 */}
        {draft.asset_type === 'CHARACTER' && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.is_protagonist === true}
                onChange={(e) => handleChange('is_protagonist', e.target.checked)}
                className="accent-teal-500 w-4 h-4"
              />
              <span className="text-sm text-slate-200">주인공 (캐릭터/비주얼 설정 대상)</span>
            </label>
          </div>
        )}

        {/* 음성 타입 */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">음성 타입</label>
          <div className="flex gap-4">
            {['TTS', 'SFX', 'NONE'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="audio_type"
                  value={type}
                  checked={draft.audio_type === type}
                  onChange={(e) => handleChange('audio_type', e.target.value)}
                  className="accent-teal-500"
                />
                <span className="text-sm text-slate-200">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 음성 힌트 (TTS일 때만) */}
        {draft.audio_type === 'TTS' && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">음성 힌트 (TTS)</label>
            <input
              type="text"
              value={draft.voice_hint || ''}
              onChange={(e) => handleChange('voice_hint', e.target.value)}
              placeholder="예: 차분하고 낮은 톤의 30대 남성"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500/50"
            />
          </div>
        )}

        {/* 외형 묘사 */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">외형 프롬프트</label>
          <textarea
            value={draft.appearance_prompt || ''}
            onChange={(e) => handleChange('appearance_prompt', e.target.value)}
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none outline-none focus:border-teal-500/50"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="secondary" onClick={onClose}>취소</Button>
        <Button onClick={handleSave}>저장</Button>
      </div>
    </Modal>
  )
}
