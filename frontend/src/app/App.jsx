/**
 * @file App.jsx
 * @description 앱 루트 컴포넌트. 레이아웃 + 라우트 조합.
 * @usage main.jsx에서 렌더링.
 * @connects routes.jsx, shared/components/layout/Layout.jsx
 */
import AppRoutes from './routes.jsx'

export default function App() {
  return <AppRoutes />
}
