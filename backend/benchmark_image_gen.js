/**
 * 8188 / 8189 이미지 생성 속도 벤치마크
 * 각 서버에서 5장 순차 생성 후 소요 시간 비교
 */
const axios = require('axios');
const { buildFluxAnchor } = require('./services/comfyui/workflows/fluxAnchor');

const SERVERS = [
  { name: '8188 (RTX3090)', url: 'http://192.168.0.3:8188' },
  { name: '8189 (A100)',    url: 'http://192.168.0.3:8189' },
];
const COUNT   = 5;
const PROMPT  = 'a young Korean woman, short black hair, ID photo style, white background';
const SEEDS   = [1111, 2222, 3333, 4444, 5555];

async function queuePrompt(baseUrl, workflow) {
  const clientId = `bench_${Date.now()}`;
  const resp = await axios.post(`${baseUrl}/prompt`, { prompt: workflow, client_id: clientId }, { timeout: 30000 });
  return { promptId: resp.data.prompt_id, clientId };
}

async function waitForResult(baseUrl, promptId, timeoutMs = 300000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const resp = await axios.get(`${baseUrl}/history/${promptId}`, { timeout: 10000 });
    if (resp.data[promptId]) return resp.data[promptId];
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error(`Timeout waiting for prompt ${promptId}`);
}

async function runServer(server) {
  console.log(`\n[${server.name}] 시작`);
  const times = [];

  for (let i = 0; i < COUNT; i++) {
    const workflow = buildFluxAnchor(PROMPT, 'PHOTOREALISTIC', 'CHARACTER', SEEDS[i]);
    const t0 = Date.now();
    const { promptId } = await queuePrompt(server.url, workflow);
    await waitForResult(server.url, promptId);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    times.push(parseFloat(elapsed));
    console.log(`  [${server.name}] ${i + 1}/${COUNT} — ${elapsed}s`);
  }

  const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
  const min = Math.min(...times).toFixed(2);
  const max = Math.max(...times).toFixed(2);
  console.log(`\n[${server.name}] 결과: avg=${avg}s  min=${min}s  max=${max}s`);
  return { server: server.name, avg: parseFloat(avg), min: parseFloat(min), max: parseFloat(max), times };
}

async function main() {
  console.log(`이미지 생성 벤치마크 — 각 서버 ${COUNT}장`);
  console.log('두 서버 병렬 실행 중...\n');

  const [r8188, r8189] = await Promise.all(SERVERS.map(runServer));

  console.log('\n======== 최종 결과 ========');
  console.log(`8188 (RTX3090): avg ${r8188.avg}s  [${r8188.times.join(', ')}s]`);
  console.log(`8189 (A100):    avg ${r8189.avg}s  [${r8189.times.join(', ')}s]`);
  const ratio = (r8188.avg / r8189.avg).toFixed(2);
  console.log(`속도 비율: A100이 RTX3090보다 ${ratio}배 ${ratio >= 1 ? '빠름' : '느림'}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
