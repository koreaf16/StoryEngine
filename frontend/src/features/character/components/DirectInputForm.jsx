/**
 * @file DirectInputForm.jsx
 * @description 캐릭터 프로필 직접 입력 폼. 4개 섹션 textarea로 구조화된 프로필 생성.
 * @usage CharacterPromptPage.jsx의 "직접 입력" 탭에서 렌더링.
 * @connects features/character/pages/CharacterPromptPage.jsx
 * @doc docs/03-character-setup.md (방식 B: 사용자 직접 입력)
 */
import { useState } from 'react'
import Button from '../../../shared/components/ui/Button.jsx'

const SECTIONS = [
  { key: 'personality', label: '성격', placeholder: '예) 과묵하고 자기 억제적. 감정을 숨기려 하지만 눈빛에서 드러남. 약자를 보면 마음이 흔들린다.' },
  { key: 'speech_style', label: '말투', placeholder: '예) 극단적 단문. 낮고 건조한 톤. "...그래", "됐어" 같은 말줄임 습관. 반말 기본.' },
  { key: 'backstory', label: '과거', placeholder: '예) 과거에 지키지 못한 사람이 있다. 속죄를 원하지만 방법을 모른다. 또 누군가를 잃는 것을 두려워한다.' },
  { key: 'behavioral_rules', label: '행동 규칙', placeholder: '예) 절대 술을 마시지 않는다\n전투 중에는 말을 하지 않는다\n거짓말을 하지 못한다 (침묵으로 회피)' },
]

export default function DirectInputForm({ onSubmit }) {
  const [fields, setFields] = useState({ personality: '', speech_style: '', backstory: '', behavioral_rules: '' })

  const handleChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    const profile = {
      personality: {
        core_trait: fields.personality,
        emotional_pattern: '',
        soft_spot: '',
      },
      speech_style: {
        sentence_length: '',
        habit_phrases: [],
        tone: fields.speech_style,
        speech_level: '',
      },
      backstory: {
        wound: fields.backstory,
        desire: '',
        fear: '',
      },
      behavioral_rules: fields.behavioral_rules
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
    }
    onSubmit(profile)
  }

  const hasContent = Object.values(fields).some((v) => v.trim())

  return (
    <div className="space-y-4">
      {SECTIONS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
          <textarea
            value={fields[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={placeholder}
            rows={key === 'behavioral_rules' ? 4 : 3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 resize-y outline-none focus:border-teal-500/50 transition-colors"
          />
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit} disabled={!hasContent}>
          프로필 확인 →
        </Button>
      </div>
    </div>
  )
}
