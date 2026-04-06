/**
 * @file PromptAPage.jsx
 * @description 1b. 프롬프트 A 페이지. 세계관 뼈대 생성 프롬프트를 표시하고 LLM 응답을 받음.
 * @usage 라우트 "/project/:id/prompt-a"
 * @connects ProjectShell(레이아웃), PromptCopyPaste, buildPromptA, useProjectStore
 * @doc docs/02-script-input.md (Pass 1: 세계관 뼈대 생성)
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PromptCopyPaste from '../../../shared/components/patterns/PromptCopyPaste.jsx'
import { getScriptStage, saveScriptStage } from '../../../services/scriptApi.js'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import buildPromptA from '../utils/buildPromptA.js'

export default function PromptAPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const saveWorldBackbone = useProjectStore((s) => s.saveWorldBackbone)
  const [savedStage, setSavedStage] = useState(null)

  useEffect(() => {
    let isMounted = true
    getScriptStage(id, 'PROMPT_A')
      .then((stage) => {
        if (isMounted && stage) {
          setSavedStage(stage)
        }
      })
      .catch((error) => {
        if (error.response?.status !== 404) {
          logError('PromptAPage.load', error, { projectId: id })
        }
      })
    return () => {
      isMounted = false
    }
  }, [id])

  if (!project) return <div className="p-8 text-slate-400">프로젝트를 찾을 수 없습니다.</div>

  const promptText = savedStage?.promptText || buildPromptA(project.seed)

  const handleSubmit = async (response) => {
    try {
      await Promise.all([
        saveScriptStage(id, 'PROMPT_A', { promptText, responseText: response, parseError: '' }),
        saveWorldBackbone(id, response),
      ])
      navigate(`/project/${id}/prompt-b`)
    } catch (error) {
      logError('PromptAPage.handleSubmit', error, { projectId: id })
      throw error
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <PromptCopyPaste
        key={`${id}-${savedStage ? 'saved' : 'fresh'}`}
        title="프롬프트 A: 세계관 뼈대 생성"
        description="아래 프롬프트를 복사해서 외부 LLM에 붙여넣으세요"
        promptText={promptText}
        initialResponse={savedStage?.responseText || ''}
        submitLabel="저장하고 프롬프트 B 생성 →"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
