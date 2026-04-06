/**
 * @file SeedInputPage.jsx
 * @description 1a. 씨앗 입력 페이지. 사용자가 자유 형식으로 이야기 아이디어를 작성.
 * @usage 라우트 "/project/:id/seed"
 * @connects ProjectShell(레이아웃), useProjectStore, SeedTextarea
 * @doc docs/02-script-input.md (사용자 입력)
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../../../shared/components/ui/Button.jsx'
import useProjectStore from '../../../store/useProjectStore.js'
import SeedTextarea from '../components/SeedTextarea.jsx'

export default function SeedInputPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const updateSeed = useProjectStore((s) => s.updateSeed)
  const [seed, setSeed] = useState(project?.seed || '')

  if (!project) return <div className="p-8 text-slate-400">프로젝트를 찾을 수 없습니다.</div>

  const handleNext = async () => {
    await updateSeed(id, seed)
    navigate(`/project/${id}/prompt-a`)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-xl font-bold text-white font-[family-name:var(--font-headline)] mb-2">
        머릿속에 있는 이야기를 자유롭게 적어주세요
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        장르, 세계관, 캐릭터, 분위기 등을 자유 형식으로 기재하세요. 구조화할 필요 없습니다.
      </p>

      <SeedTextarea value={seed} onChange={setSeed} />

      <div className="flex justify-end mt-6">
        <Button onClick={handleNext} disabled={!seed.trim()}>
          프롬프트 생성 →
        </Button>
      </div>
    </div>
  )
}
