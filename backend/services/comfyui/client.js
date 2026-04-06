/**
 * @file services/comfyui/client.js
 * @description ComfyUI REST API 클라이언트. 워크플로우 큐잉, 결과 polling, 이미지 다운로드/업로드 담당.
 * @usage features/visual/ 하위 서비스에서 GPU 작업 요청 시 사용.
 * @connects ComfyUI Server, services/comfyui/wsListener.js
 * @doc docs/04-visual-factory.md
 */
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { ComfyUIWebSocketListener, tracker } = require('./wsListener');
const { COMFYUI_BASE_URL } = require('../../app/config');
const { logError } = require('../../app/logger');

class ComfyUIClient {
  constructor(baseUrl = COMFYUI_BASE_URL) {
    this.baseUrl = baseUrl;
    this.clientId = uuidv4();
    this._wsListener = null;
  }

  get wsConnected() {
    return this._wsListener !== null && this._wsListener.connected;
  }

  connectWs() {
    this._wsListener = new ComfyUIWebSocketListener(this.baseUrl, this.clientId, tracker);
    this._wsListener.start();
  }

  disconnectWs() {
    if (this._wsListener) {
      this._wsListener.stop();
      this._wsListener = null;
    }
  }

  async queuePrompt(workflow) {
    const payload = { prompt: workflow, client_id: this.clientId };
    try {
      const resp = await axios.post(`${this.baseUrl}/prompt`, payload, { timeout: 30000 });
      return resp.data.prompt_id;
    } catch (err) {
      if (err.response?.data) {
        const detail = typeof err.response.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response.data, null, 2);
        err.message = `ComfyUI prompt rejected (${err.response.status}): ${detail}`;
      }
      throw err;
    }
  }

  async pollResult(promptId, interval = 1500, maxWait = 300000) {
    const deadline = Date.now() + maxWait;
    while (Date.now() < deadline) {
      const resp = await axios.get(`${this.baseUrl}/history/${promptId}`, { timeout: 10000 });
      if (resp.data[promptId]) return resp.data[promptId];
      await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error(`ComfyUI: prompt ${promptId} did not complete in ${maxWait / 1000}s`);
  }

  async downloadImage(filename, subfolder = '', imgType = 'output') {
    const resp = await axios.get(`${this.baseUrl}/view`, {
      params: { filename, subfolder, type: imgType },
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    return Buffer.from(resp.data);
  }

  async uploadImage(imageBuffer, filename, subfolder = '') {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('image', imageBuffer, {
      filename,
      contentType: 'image/png',
      knownLength: imageBuffer.length,
    });
    if (subfolder) form.append('subfolder', subfolder);
    const resp = await axios.post(`${this.baseUrl}/upload/image`, form, {
      headers: form.getHeaders(),
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return resp.data; // { name, subfolder, type }
  }

  extractOutputImages(history) {
    const images = [];
    const outputs = history.outputs || {};
    for (const nodeOutput of Object.values(outputs)) {
      for (const img of nodeOutput.images || []) {
        images.push({
          filename: img.filename,
          subfolder: img.subfolder || '',
          type: img.type || 'output',
        });
      }
    }
    return images;
  }

  async getQueue() {
    const resp = await axios.get(`${this.baseUrl}/queue`, { timeout: 5000 });
    const running = resp.data.queue_running || [];
    const pending = resp.data.queue_pending || [];
    return {
      running: running.length,
      pending: pending.length,
      running_ids: running.map((r) => r[1]).filter(Boolean),
      pending_ids: pending.map((p) => p[1]).filter(Boolean),
    };
  }

  async getProgress() {
    if (this.wsConnected) return tracker.getProgress();
    // ComfyUI는 /progress HTTP 엔드포인트를 제공하지 않음 — WebSocket 전용
    return { value: 0, max: 0, ws_disconnected: true };
  }

  async interrupt() {
    try {
      const [r1, r2] = await Promise.all([
        axios.post(`${this.baseUrl}/interrupt`, {}, { timeout: 5000 }),
        axios.post(`${this.baseUrl}/queue`, { clear: true }, { timeout: 5000 }),
      ]);
      return r1.status === 200 || r2.status === 200;
    } catch (err) {
      logError('comfyui.interrupt', err, { baseUrl: this.baseUrl, clientId: this.clientId });
      return false;
    }
  }

  /** 로드된 모델을 모두 언로드하고 VRAM을 해제한다. 플로우 전환 시(예: LoRA 학습 진입 전) 호출. */
  async freeMemory() {
    try {
      await axios.post(`${this.baseUrl}/free`, { unload_models: true, free_memory: true }, { timeout: 10000 });
    } catch (err) {
      logError('comfyui.freeMemory', err, { baseUrl: this.baseUrl });
    }
  }

  async systemStats() {
    const resp = await axios.get(`${this.baseUrl}/system_stats`, { timeout: 5000 });
    return resp.data;
  }

  /** ComfyUI에 등록된 LoRA 파일명 목록을 반환한다. */
  async getAvailableLoras() {
    const resp = await axios.get(`${this.baseUrl}/object_info/LoraLoader`, { timeout: 10000 });
    const loraInput = resp.data?.LoraLoader?.input?.required?.lora_name;
    return Array.isArray(loraInput?.[0]) ? loraInput[0] : [];
  }

  /**
   * LoRA 파일을 ComfyUI loras 폴더에 배포한다 (story_engine_api 커스텀 노드 필요).
   * @param {Buffer} loraBuffer
   * @param {string} filename  ComfyUI loras 기준 상대경로 (예: 'story_engine\\han_v1.safetensors')
   */
  async deployLora(loraBuffer, filename) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('lora', loraBuffer, { filename: 'lora.safetensors', contentType: 'application/octet-stream' });
    const resp = await axios.post(`${this.baseUrl}/story_engine/upload/lora`, form, {
      headers: { ...form.getHeaders(), 'X-Lora-Filename': filename },
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return resp.data;
  }
}

const comfyui = new ComfyUIClient();

module.exports = { ComfyUIClient, comfyui };
