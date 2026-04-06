/**
 * @file Layout.jsx
 * @description 프로젝트 내부 페이지용 공통 레이아웃. Header + 진행바 + 메인 콘텐츠 영역.
 * @usage 프로젝트 내부 모든 페이지에서 래핑 (SeedInput, PromptA, AssetConfirm 등).
 * @connects Header.jsx, ProgressBar.jsx
 * @doc docs/10-ui-spec.md (전체 화면 구조)
 */
import Header from './Header.jsx'
import ProgressBar from './ProgressBar.jsx'

export default function Layout({
  projectTitle,
  phaseBadge,
  currentStep = 'script',
  completedSteps = [],
  showProgress = true,
  children,
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Header projectTitle={projectTitle} phaseBadge={phaseBadge} />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {showProgress && (
        <ProgressBar currentStep={currentStep} completedSteps={completedSteps} />
      )}
    </div>
  )
}
