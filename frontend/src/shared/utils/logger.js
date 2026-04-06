/**
 * @file logger.js
 * @description 프론트엔드 전역/비동기 오류를 일관된 포맷으로 콘솔에 남기는 공통 로거.
 * @usage app/main.jsx, ErrorBoundary, services, hooks, pages의 catch 블록에서 사용.
 * @connects window error handlers, axios/fetch error paths, React error boundary
 * @doc docs/10-ui-spec.md
 */
let isGlobalLoggingRegistered = false

function serializeError(error) {
  if (error instanceof Error) {
    const response = error.response
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause ?? null,
      ...(response
        ? {
            response: {
              status: response.status,
              statusText: response.statusText,
              data: response.data,
            },
            request: {
              method: error.config?.method?.toUpperCase?.() ?? error.config?.method ?? null,
              url: error.config?.url ?? null,
            },
          }
        : {}),
    }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  try {
    return JSON.parse(JSON.stringify(error))
  } catch {
    return { value: String(error) }
  }
}

export function logError(context, error, details = {}) {
  console.error(`[${context}]`, {
    ...details,
    error: serializeError(error),
  })
}

export function logWarning(context, message, details = {}) {
  console.warn(`[${context}] ${message}`, details)
}

export function registerGlobalErrorLogging() {
  if (isGlobalLoggingRegistered || typeof window === 'undefined') return
  isGlobalLoggingRegistered = true

  window.addEventListener('error', (event) => {
    logError('window.error', event.error ?? event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logError('window.unhandledrejection', event.reason ?? new Error('Unhandled promise rejection'))
  })
}
