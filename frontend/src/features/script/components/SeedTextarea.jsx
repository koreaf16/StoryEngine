/**
 * @file SeedTextarea.jsx
 * @description 씨앗 입력용 대형 텍스트 영역. placeholder에 예시 텍스트 포함.
 * @usage SeedInputPage에서 사용.
 * @connects 없음 (props로 value/onChange 전달받음)
 * @doc docs/02-script-input.md (사용자 입력 예시)
 */

const PLACEHOLDER = `장르: 다크 판타지
분위기: 어둡고 긴장감 있는, 오케스트라풍 BGM
주인공: 카이 - 20대 남성 떠돌이 검객, 긴 검은 머리, 왼쪽 뺨에 흉터, 저주받은 붉은 수정검을 들고 다닌다
핵심 갈등: 과거에 지키지 못한 사람에 대한 죄책감
시작 장소: 항구 마을 비레
기타 캐릭터: 상인 보록 - 40대 뚱뚱한 약초 상인
몬스터: 그림자 늑대 - 밤에만 활동하는 안개 속 짐승
세계관 규칙: 수정에 영혼이 깃들 수 있다`

export default function SeedTextarea({ value, onChange }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={PLACEHOLDER}
      rows={14}
      className="
        w-full bg-slate-800 border border-slate-700 rounded-lg
        px-4 py-3 text-sm text-slate-200 placeholder-slate-500
        resize-y outline-none min-h-[300px]
        focus:border-teal-500/50 transition-colors
        leading-relaxed
      "
    />
  )
}
