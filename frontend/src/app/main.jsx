/**
 * @file main.jsx
 * @description 앱 엔트리포인트. React DOM 렌더링 + BrowserRouter 래핑.
 * @usage index.html에서 참조. 앱 최초 진입점.
 * @connects App.jsx, index.css
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import '../index.css'
import AppErrorBoundary from '../shared/components/errors/AppErrorBoundary.jsx'
import { registerGlobalErrorLogging } from '../shared/utils/logger.js'

registerGlobalErrorLogging()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
)
