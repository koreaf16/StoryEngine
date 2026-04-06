/**
 * @file PromptBPage.jsx
 * @description 1d. 프롬프트 B 페이지. 에셋 JSON 추출 프롬프트를 표시하고 LLM 응답을 파싱.
 * @usage 라우트 "/project/:id/prompt-b"
 * @connects ProjectShell(레이아웃), PromptCopyPaste, buildPromptB, parseAssetJson, useProjectStore
 * @doc docs/02-script-input.md (Pass 2: 에셋 JSON 추출)
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PromptCopyPaste from '../../../shared/components/patterns/PromptCopyPaste.jsx'
import { getScriptStage, saveScriptStage } from '../../../services/scriptApi.js'
import useProjectStore from '../../../store/useProjectStore.js'
import { logError } from '../../../shared/utils/logger.js'
import parseAssetJson from '../utils/parseAssetJson.js'
import buildPromptB from '../utils/buildPromptB.js'

export default function PromptBPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.getProject(id))
  const saveAssets = useProjectStore((s) => s.saveAssets)
  const [error, setError] = useState(null)
  const [savedStage, setSavedStage] = useState(null)

  useEffect(() => {
    let isMounted = true
    getScriptStage(id, 'PROMPT_B')
      .then((stage) => {
        if (isMounted && stage) {
          setSavedStage(stage)
        }
      })
      .catch((error) => {
        if (error.response?.status !== 404) {
          logError('PromptBPage.load', error, { projectId: id })
        }
      })
    return () => {
      isMounted = false
    }
  }, [id])

  if (!project) return <div className="p-8 text-slate-400">프로젝트를 찾을 수 없습니다.</div>

  const promptText = buildPromptB(project.worldBackbone, project.seed)

  const handleSubmit = async (response) => {
    setError(null)
    try {
      const assets = parseAssetJson(response)
      await Promise.all([
        saveScriptStage(id, 'PROMPT_B', {
          promptText,
          responseText: response,
          parsedJson: assets,
          parseError: '',
        }),
        saveAssets(id, assets),
      ])
      navigate(`/project/${id}/assets`)
    } catch (e) {
      logError('PromptBPage.handleSubmit', e, { projectId: id })
      await saveScriptStage(id, 'PROMPT_B', {
        promptText,
        responseText: response,
        parsedJson: null,
        parseError: e.message,
      }).catch((error) => {
        logError('PromptBPage.saveParseError', error, { projectId: id })
      })
      setError(e.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <PromptCopyPaste
        key={`${id}-${savedStage ? 'saved' : 'fresh'}`}
        title="프롬프트 B: 에셋 JSON 추출"
        description="아래 프롬프트를 복사해서 외부 LLM에 붙여넣으세요. JSON만 반환하도록 요청합니다."
        promptText={promptText}
        initialResponse={savedStage?.responseText || ''}
        submitLabel="파싱하고 에셋 확인 →"
        onSubmit={handleSubmit}
      />

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          <strong>파싱 에러:</strong> {error}
          <p className="mt-1 text-red-400/70">LLM에 다시 요청하거나 JSON 형식을 확인해주세요.</p>
        </div>
      )}
    </div>
  )
}
