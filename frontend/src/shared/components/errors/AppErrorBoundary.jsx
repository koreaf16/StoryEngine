/**
 * @file AppErrorBoundary.jsx
 * @description React 렌더/라이프사이클 오류를 잡아 콘솔에 남기고 대체 화면을 보여주는 경계.
 * @usage app/main.jsx에서 App 전체를 감쌀 때 사용.
 * @connects shared/utils/logger.js
 * @doc docs/10-ui-spec.md
 */
import { Component } from 'react'
import { logError } from '../../utils/logger.js'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    logError('ReactErrorBoundary', error, {
      componentStack: info.componentStack,
    })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
          <div className="max-w-lg w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-200">
            <h1 className="text-xl font-semibold text-white">화면 렌더 오류</h1>
            <p className="mt-2 text-sm text-slate-400">
              콘솔에 오류 상세가 기록되었습니다. 새로고침 후 다시 확인하세요.
            </p>
            <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950/70 p-3 text-xs text-red-300">
              {this.state.error?.message ?? 'Unknown error'}
            </pre>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
