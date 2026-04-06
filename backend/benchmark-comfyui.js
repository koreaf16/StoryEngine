/**
 * @file benchmark-comfyui.js
 * @description 두 ComfyUI 인스턴스에 동일한 앵커 워크플로우를 전송하여 속도를 비교한다.
 * @usage node benchmark-comfyui.js
 */
const { ComfyUIClient } = require('./services/comfyui/client');
const { buildFluxAnchor } = require('./services/comfyui/workflows/fluxAnchor');

const INSTANCES = [
  { name: 'ComfyUI-B (8189)', url: 'http://192.168.0.3:8189' },
];

const TEST_PROMPT = 'a brave warrior standing in a medieval castle courtyard, detailed armor, dramatic lighting';
const FIXED_SEED = 42;

async function checkReachable(client, name) {
  try {
    const stats = await client.systemStats();
    const gpu = stats.devices?.[0];
    console.log(`  [${name}] GPU: ${gpu?.name || 'unknown'}, VRAM: ${Math.round((gpu?.vram_total || 0) / 1024 / 1024)}MB`);
    return true;
  } catch (err) {
    console.error(`  [${name}] 연결 실패: ${err.message}`);
    return false;
  }
}

async function runBenchmark(client, name, workflow) {
  const t0 = Date.now();

  // 큐 제출
  const promptId = await client.queuePrompt(workflow);
  const tQueued = Date.now();
  console.log(`  [${name}] 큐 제출 완료 (${tQueued - t0}ms) — prompt_id: ${promptId}`);

  // 완료 대기
  const history = await client.pollResult(promptId, 1000, 600000);
  const tDone = Date.now();

  const images = client.extractOutputImages(history);
  const totalSec = ((tDone - t0) / 1000).toFixed(1);
  const genSec = ((tDone - tQueued) / 1000).toFixed(1);

  return {
    name,
    promptId,
    totalMs: tDone - t0,
    genMs: tDone - tQueued,
    queueMs: tQueued - t0,
    imageCount: images.length,
    totalSec,
    genSec,
  };
}

async function main() {
  console.log('=== ComfyUI 속도 벤치마크 ===\n');
  console.log(`프롬프트: "${TEST_PROMPT}"`);
  console.log(`시드: ${FIXED_SEED}`);
  console.log(`해상도: 1024x1024, 20 steps, euler sampler\n`);

  // 클라이언트 생성
  const clients = INSTANCES.map(({ name, url }) => ({
    name,
    client: new ComfyUIClient(url),
  }));

  // 연결 확인
  console.log('--- 연결 확인 ---');
  const reachable = [];
  for (const { name, client } of clients) {
    const ok = await checkReachable(client, name);
    if (ok) reachable.push({ name, client });
  }
  console.log();

  if (reachable.length === 0) {
    console.error('연결 가능한 ComfyUI 인스턴스가 없습니다.');
    process.exit(1);
  }

  // 동일 워크플로우 빌드
  const workflow = buildFluxAnchor(TEST_PROMPT, 'PHOTOREALISTIC', 'CHARACTER', FIXED_SEED);

  // 동시에 벤치마크 실행
  console.log('--- 벤치마크 시작 (동시 실행) ---');
  const startAll = Date.now();

  const promises = reachable.map(({ name, client }) =>
    runBenchmark(client, name, workflow).catch((err) => ({
      name,
      error: err.message,
    }))
  );

  const results = await Promise.all(promises);
  const elapsed = ((Date.now() - startAll) / 1000).toFixed(1);

  // 결과 출력
  console.log(`\n--- 결과 (총 ${elapsed}초) ---\n`);
  console.log('┌─────────────────────────┬──────────┬──────────┬──────────┬────────┐');
  console.log('│ 인스턴스                │ 총 시간  │ 생성시간 │ 큐 대기  │ 이미지 │');
  console.log('├─────────────────────────┼──────────┼──────────┼──────────┼────────┤');

  for (const r of results) {
    if (r.error) {
      console.log(`│ ${r.name.padEnd(23)} │ 에러: ${r.error.substring(0, 40).padEnd(40)} │`);
    } else {
      const name = r.name.padEnd(23);
      const total = `${r.totalSec}s`.padStart(8);
      const gen = `${r.genSec}s`.padStart(8);
      const queue = `${(r.queueMs / 1000).toFixed(1)}s`.padStart(8);
      const imgs = String(r.imageCount).padStart(6);
      console.log(`│ ${name} │ ${total} │ ${gen} │ ${queue} │ ${imgs} │`);
    }
  }

  console.log('└─────────────────────────┴──────────┴──────────┴──────────┴────────┘');

  // 승자 판정
  const successful = results.filter((r) => !r.error);
  if (successful.length >= 2) {
    successful.sort((a, b) => a.totalMs - b.totalMs);
    const faster = successful[0];
    const slower = successful[1];
    const diff = ((slower.totalMs - faster.totalMs) / 1000).toFixed(1);
    const pct = ((1 - faster.totalMs / slower.totalMs) * 100).toFixed(1);
    console.log(`\n🏆 ${faster.name}이(가) ${diff}초 (${pct}%) 더 빠릅니다.`);
  }
}

main().catch((err) => {
  console.error('벤치마크 실패:', err);
  process.exit(1);
});
