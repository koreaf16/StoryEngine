/**
 * @file services/comfyui/wsListener.js
 * @description ComfyUI WebSocket real-time event listener for tracking progress.
 * @usage services/comfyui/client.js
 * @connects ComfyUI Server WebSocket, ProgressTracker
 * @doc docs/04-visual-factory.md
 */
const WebSocket = require('ws');
const { logError, logWarn, logInfo } = require('../../app/logger');

class ProgressTracker {
  constructor() {
    this._current = { value: 0, max: 0 };
    this._lastUpdate = 0;
    this._executedOutputs = {}; // promptId → { nodeId: outputData }
  }

  onProgress(value, max) {
    this._current = { value, max };
    this._lastUpdate = Date.now();
  }

  onExecuted(promptId, nodeId, output) {
    if (!this._executedOutputs[promptId]) this._executedOutputs[promptId] = {};
    this._executedOutputs[promptId][nodeId] = output;
  }

  getExecutedOutputs(promptId) {
    return this._executedOutputs[promptId] || {};
  }

  clearExecutedOutputs(promptId) {
    delete this._executedOutputs[promptId];
  }

  reset() {
    if (this._current.max > 0 && Date.now() - this._lastUpdate < 1000) {
      this._current = { value: this._current.max, max: this._current.max };
      return;
    }
    this._current = { value: 0, max: 0 };
    this._lastUpdate = 0;
  }

  getProgress() {
    if (this._lastUpdate > 0 && Date.now() - this._lastUpdate > 30000) {
      this._current = { value: 0, max: 0 };
      this._lastUpdate = 0;
    }
    return { ...this._current };
  }
}

class ComfyUIWebSocketListener {
  constructor(baseUrl, clientId, tracker) {
    const wsBase = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    this._url = `${wsBase}/ws?clientId=${clientId}`;
    this._tracker = tracker;
    this._ws = null;
    this._connected = false;
    this._stopped = false;
    this._backoff = 1000;
  }

  get connected() {
    return this._connected;
  }

  start() {
    this._stopped = false;
    this._connect();
  }

  stop() {
    this._stopped = true;
    if (this._ws) {
      this._ws.terminate();
      this._ws = null;
    }
    this._connected = false;
  }

  _connect() {
    if (this._stopped) return;

    try {
      const ws = new WebSocket(this._url, { handshakeTimeout: 10000 });
      this._ws = ws;

      ws.on('open', () => {
        this._connected = true;
        this._backoff = 1000;
        logInfo('comfyui.ws', 'Connected', { url: this._url });
      });

      ws.on('message', (raw, isBinary) => {
        if (isBinary) return;
        try {
          const msg = JSON.parse(raw.toString());
          const { type, data = {} } = msg;
          if (type === 'progress') {
            this._tracker.onProgress(data.value || 0, data.max || 0);
          } else if (type === 'execution_start' || type === 'execution_interrupted') {
            this._tracker.reset();
          } else if (type === 'execution_complete') {
            this._tracker.reset();
          } else if (type === 'executed') {
            const { prompt_id, node, output } = data;
            if (prompt_id && node && output) {
              this._tracker.onExecuted(prompt_id, node, output);
            }
          }
        } catch (err) {
          logError('comfyui.ws.message', err, { url: this._url });
        }
      });

      ws.on('close', () => {
        this._connected = false;
        if (!this._stopped) {
          logWarn('comfyui.ws', 'Disconnected, scheduling reconnect', { url: this._url, backoffMs: this._backoff });
          setTimeout(() => this._connect(), this._backoff);
          this._backoff = Math.min(this._backoff * 2, 30000);
        }
      });

      ws.on('error', (err) => {
        this._connected = false;
        logError('comfyui.ws.error', err, { url: this._url });
      });
    } catch (err) {
      logError('comfyui.ws.connect', err, { url: this._url, backoffMs: this._backoff });
      if (!this._stopped) {
        setTimeout(() => this._connect(), this._backoff);
        this._backoff = Math.min(this._backoff * 2, 30000);
      }
    }
  }
}

const tracker = new ProgressTracker();

module.exports = { ProgressTracker, ComfyUIWebSocketListener, tracker };
