/**
 * @file ProfileEditModal.jsx
 * @description 프로필 섹션 편집 모달. sectionKey에 따라 동적 폼 렌더링.
 * @usage CharacterConfirmPage.jsx에서 섹션 편집 버튼 클릭 시 표시.
 * @connects shared/components/ui/Modal.jsx, shared/components/ui/Button.jsx
 * @doc docs/03-character-setup.md (캐릭터 프로필 데이터 구조)
 */
import { useState } from 'react'
import Modal from '../../../shared/components/ui/Modal.jsx'
import Button from '../../../shared/components/ui/Button.jsx'

const SECTION_TITLES = {
  personality: '성격 편집',
  speech_style: '말투 편집',
  backstory: '과거 편집',
  behavioral_rules: '행동 규칙 편집',
}

const FIELD_LABELS = {
  core_trait: '핵심 성격',
  emotional_pattern: '감정 패턴',
  soft_spot: '약한 부분',
  sentence_length: '문장 길이',
  habit_phrases: '말버릇 (쉼표로 구분)',
  tone: '톤',
  speech_level: '존댓말 여부',
  wound: '핵심 상처',
  desire: '욕구',
  fear: '두려움',
}

function createDraft(sectionKey, data) {
  if (sectionKey === 'behavioral_rules') {
    return (data ?? []).join('\n')
  }

  return { ...(data ?? {}) }
}

export default function ProfileEditModal({ isOpen, onClose, sectionKey, data, onSave }) {
  const [draft, setDraft] = useState(() => createDraft(sectionKey, data))

  if (!isOpen) return null

  const handleSave = () => {
    if (sectionKey === 'behavioral_rules') {
      const rules = draft.split('\n').map((r) => r.trim()).filter(Boolean)
      onSave(sectionKey, rules)
    } else {
      onSave(sectionKey, draft)
    }
    onClose()
  }

  const handleFieldChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={SECTION_TITLES[sectionKey] ?? '편집'}>
      <div className="space-y-3">
        {sectionKey === 'behavioral_rules' ? (
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">규칙 (한 줄에 하나씩)</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 resize-y outline-none focus:border-teal-500/50"
            />
          </div>
        ) : (
          Object.keys(draft).map((key) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{FIELD_LABELS[key] ?? key}</label>
              {key === 'habit_phrases' ? (
                <input
                  type="text"
                  value={Array.isArray(draft[key]) ? draft[key].join(', ') : draft[key]}
                  onChange={(e) =>
                    handleFieldChange(
                      key,
                      e.target.value.split(',').map((v) => v.trim()).filter(Boolean)
                    )
                  }
                  placeholder="예) ...그래, 됐어, 알아서 해"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500/50"
                />
              ) : (
                <textarea
                  value={draft[key] ?? ''}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  rows={2}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none outline-none focus:border-teal-500/50"
                />
              )}
            </div>
          ))
        )}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={onClose}>취소</Button>
        <Button onClick={handleSave}>저장</Button>
      </div>
    </Modal>
  )
}
