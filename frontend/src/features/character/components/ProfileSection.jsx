/**
 * @file ProfileSection.jsx
 * @description 캐릭터 프로필의 단일 섹션 렌더러. 객체면 key-value, 배열이면 태그 목록.
 * @usage CharacterConfirmPage.jsx에서 성격/말투/과거/행동규칙 섹션별 표시.
 * @connects features/character/pages/CharacterConfirmPage.jsx
 * @doc docs/03-character-setup.md (캐릭터 프로필 데이터 구조)
 */

const FIELD_LABELS = {
  core_trait: '핵심 성격',
  emotional_pattern: '감정 패턴',
  soft_spot: '약한 부분',
  sentence_length: '문장 길이',
  habit_phrases: '말버릇',
  tone: '톤',
  speech_level: '존댓말 여부',
  wound: '핵심 상처',
  desire: '욕구',
  fear: '두려움',
}

function FieldRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  return (
    <div className="flex gap-3">
      <span className="text-xs text-slate-500 w-20 shrink-0 pt-0.5">{label}</span>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
              {v}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-sm text-slate-200 leading-relaxed">{value}</span>
      )}
    </div>
  )
}

export default function ProfileSection({ title, sectionKey, data, onEdit }) {
  const isEmpty = !data ||
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === 'object' && !Array.isArray(data) && Object.values(data).every((v) => !v || (Array.isArray(v) && v.length === 0)))

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button
          onClick={() => onEdit(sectionKey, data)}
          className="text-xs text-slate-400 hover:text-teal-400 transition-colors"
        >
          편집
        </button>
      </div>

      {isEmpty ? (
        <p className="text-xs text-slate-600">(미입력)</p>
      ) : Array.isArray(data) ? (
        <ul className="space-y-1.5">
          {data.map((rule, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-teal-500 mt-0.5">•</span>
              <span className="text-sm text-slate-200">{rule}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <FieldRow key={key} label={FIELD_LABELS[key] ?? key} value={value} />
          ))}
        </div>
      )}
    </div>
  )
}
