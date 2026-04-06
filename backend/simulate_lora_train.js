const axios = require('axios');
const { logInfo, logError } = require('./app/logger');

const PROJECT_ID = 'p_0c2b71d2';
const ASSET_ID = 'han_soyul';
const IMAGE_IDS = ["img_adf053b26c1942a29526638e4b678b95","img_c3b965e55c5c4b40b87fb52a45ff1278","img_af81dcd8c4264ccb930f992e02172500","img_9a9031c349294335984edf856bbb7c3b","img_7532c10280864633acce51656e59556d","img_dd22609d0ed649558483b8a027e2aa3a","img_804ddcf7974b4648985f28e0125fa0c4","img_c9ef16c813bb4cbb8e621d56f7a13180","img_435fddb8cba84330899243055515647e","img_1b8b0a5b8c91456384d466b0d11f4b0c","img_569cde5410d240978b47d7c8df519863","img_cf067aa195794d869077f019b0d33caf","img_7b79725a74714fe2b923f7b3f2865f02","img_9705e0f10fbe47c59bda9373a0d9fd24","img_5401b127d629475d968b41a62c449a01"];

async function runTrainingSimulation() {
  console.log('--- 한소율 LoRA 학습 시작 (8189 서버) ---');
  
  try {
    // 1. 학습 트리거
    const startResp = await axios.post('http://localhost:2021/api/visual/lora/train', {
      project_id: PROJECT_ID,
      asset_id: ASSET_ID,
      asset_name: '한소율',
      passed_image_ids: IMAGE_IDS
    });
    
    const taskId = startResp.data.task_id;
    console.log(`학습 태스크 생성됨: ${taskId}`);
    
    // 2. 초기 관찰 (약 10초 대기 후 속도 측정 시작)
    console.log('초기화 대기 중 (이미지 업로드 및 워크플로우 로드)...');
    await new Promise(r => setTimeout(r, 15000));
    
    let firstStep = 0;
    let firstTime = Date.now();
    let totalSteps = 1500;
    
    // 3. 약 5분(또는 짧은 시간) 동안 샘플링하여 속도 측정
    // 여기서는 실제 5분을 기다리지 않고 30초 정도의 속도로 추정하여 결과를 리포트합니다.
    // (실제 5분을 기다리려면 CLI 응답이 너무 늦어지므로, 샘플링 후 예측치를 계산함)
    
    for (let i = 0; i < 3; i++) {
      const statusResp = await axios.get(`http://localhost:2021/api/visual/lora/status/${taskId}`);
      const task = statusResp.data;
      console.log(`진행 상황 (${i+1}): status=${task.status}, step=${task.stepValue}/${task.stepMax || totalSteps}, progress=${(task.progress * 100).toFixed(1)}%`);
      
      if (i === 0) firstStep = task.stepValue;
      if (i === 2) {
        const elapsedMs = Date.now() - firstTime;
        const stepsDone = task.stepValue - firstStep;
        totalSteps = task.stepMax || 1500;
        
        if (stepsDone > 0) {
          const msPerStep = elapsedMs / stepsDone;
          const remainingSteps = totalSteps - task.stepValue;
          const remainingMs = remainingSteps * msPerStep;
          const totalMs = totalSteps * msPerStep;
          
          console.log('\n--- 학습 시간 분석 결과 ---');
          console.log(`현재 속도: ${(msPerStep / 1000).toFixed(2)}초/step`);
          console.log(`전체 예상 소요 시간: ${(totalMs / 1000 / 60).toFixed(1)}분`);
          console.log(`남은 예상 시간: ${(remainingMs / 1000 / 60).toFixed(1)}분`);
          console.log('---------------------------\n');
        } else {
          console.log('\n[알림] 아직 학습이 본격적으로 시작되지 않았거나 대기 중입니다 (Queue).');
        }
      }
      
      await new Promise(r => setTimeout(r, 10000)); // 10초 간격 샘플링
    }
    
  } catch (err) {
    console.error('학습 트리거 중 오류 발생:', err.response?.data || err.message);
  }
}

runTrainingSimulation();
