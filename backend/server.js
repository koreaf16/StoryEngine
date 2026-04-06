/**
 * @file server.js
 * @description Express app bootstrap, global error handling, and startup orchestration.
 * @usage backend server entrypoint.
 * @connects features/visual/router.js, features/project/router.js, features/episode/router.js, features/episode/snap/router.js
 * @doc docs/00-overview.md
 */
const express = require('express');
const cors = require('cors');
const { initDbPool, closeDbPool } = require('./app/database');
const { ensureProjectColumns, ensureAssetsColumns, ensureEpisodeColumns, ensureShotColumns, ensureMemoryTables } = require('./app/schemaSync');
const { loadFaceModels } = require('./services/imageProcessing/face/detector');
const { logError, logInfo, logWarn } = require('./app/logger');

const visualRouter = require('./features/visual/router');
const projectRouter = require('./features/project/router');
const scriptRouter = require('./features/script/router');
const episodeRouter = require('./features/episode/router');
const memoryRouter = require('./features/memory/router');

const app = express();
const PORT = 2021;

app.use(cors({ origin: 'http://localhost:2020' }));
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  },
}));

app.use('/api/visual', visualRouter);
app.use('/api/projects', projectRouter);
app.use('/api/projects', scriptRouter);
app.use('/api/projects', episodeRouter);
app.use('/api/projects', memoryRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody.slice(0, 500) : '';
    logError('backend.invalidJson', err, {
      method: req.method,
      url: req.originalUrl,
      rawBody,
    });
    return res.status(400).json({
      error: 'Invalid JSON payload',
      message: err.message,
      path: req.originalUrl,
    });
  }

  return next(err);
});

app.use((err, req, res, _next) => {
  logError('backend.unhandledError', err, {
    method: req.method,
    url: req.originalUrl,
  });
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

async function start() {
  try {
    await initDbPool();
    logInfo('backend.start', 'Oracle DB init complete');
    await ensureProjectColumns();
    logInfo('backend.start', 'Projects schema sync complete');
    await ensureAssetsColumns();
    logInfo('backend.start', 'Assets schema sync complete');
    await ensureEpisodeColumns();
    logInfo('backend.start', 'Episodes schema sync complete');
    await ensureShotColumns();
    logInfo('backend.start', 'Shots schema sync complete');
    await ensureMemoryTables();
    logInfo('backend.start', 'Memory tables sync complete');

    const faceModelsReady = await loadFaceModels();
    if (faceModelsReady) {
      logInfo('backend.start', 'Face models loaded');
    } else {
      logWarn('backend.start', 'Face-API unavailable; continuing without face scoring');
    }

    const { comfyui } = require('./services/comfyui/client');
    comfyui.connectWs();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logInfo('backend.start', `Server listening on http://0.0.0.0:${PORT}`);
    });

    server.on('error', (listenErr) => {
      logError('backend.listen', listenErr, { port: PORT });
      process.exit(1);
    });
  } catch (err) {
    logError('backend.start', err, { port: PORT });
    process.exit(1);
  }
}

async function shutdown(reason) {
  logInfo('backend.shutdown', 'Shutdown requested', { reason });
  try {
    const { comfyui } = require('./services/comfyui/client');
    comfyui.disconnectWs();
    await closeDbPool();
  } catch (err) {
    logError('backend.shutdown', err, { reason });
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logError('backend.unhandledRejection', reason);
});
process.on('uncaughtException', (err) => {
  logError('backend.uncaughtException', err);
  process.exit(1);
});

start();
