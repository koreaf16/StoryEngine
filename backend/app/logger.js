/**
 * @file logger.js
 * @description Backend console logging helpers with error serialization.
 * @usage server.js, routers, services.
 * @connects process-level handlers, route handlers, service catch blocks
 * @doc docs/00-overview.md
 */
function serializeError(err) {
  if (!err) return null;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      status: err.status ?? null,
    };
  }

  if (typeof err === 'string') {
    return { message: err };
  }

  try {
    return JSON.parse(JSON.stringify(err));
  } catch {
    return { value: String(err) };
  }
}

function logError(context, err, details = {}) {
  console.error(`[${context}]`, {
    ...details,
    error: serializeError(err),
    pid: process.pid,
    ts: new Date().toISOString(),
  });
}

function logWarn(context, message, details = {}) {
  console.warn(`[${context}] ${message}`, {
    ...details,
    pid: process.pid,
    ts: new Date().toISOString(),
  });
}

function logInfo(context, message, details = {}) {
  console.log(`[${context}] ${message}`, {
    ...details,
    pid: process.pid,
    ts: new Date().toISOString(),
  });
}

module.exports = { logError, logWarn, logInfo, serializeError };
