/**
 * @file AppShell.jsx
 * @description 앱 전체 쉘 레이아웃. TopNav + 메인 콘텐츠 + Footer. 프로젝트 목록용.
 * @usage 프로젝트 목록 등 대시보드 레벨 페이지에서 사용.
 * @connects TopNav.jsx, Footer.jsx
 * @doc docs/10-ui-spec.md (전체 화면 구조)
 */
import TopNav from './TopNav.jsx'
import Footer from './Footer.jsx'

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1525]">
      <TopNav />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
