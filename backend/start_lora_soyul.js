const { withConnection, closeDbPool } = require('./app/database');
const axios = require('axios');

async function startTraining() {
  try {
    const data = await withConnection(async (conn) => {
      // 1. 에셋 정보 (project_id, display_name)
      const assetRes = await conn.execute(
        `SELECT project_id, asset_id, display_name FROM assets WHERE asset_id = 'han_soyul'`
      );
      if (assetRes.rows.length === 0) throw new Error('Asset not found');
      const [projectId, assetId, displayName] = assetRes.rows[0];

      // 2. 통과된 이미지 ID 목록
      const imageRes = await conn.execute(
        `SELECT f.file_id
         FROM system_files f
         JOIN asset_derived_images d ON f.file_id = d.image_id
         WHERE f.asset_id = :1 AND d.is_passed = 1`,
        [assetId]
      );
      const passedImageIds = imageRes.rows.map(r => r[0]);

      return { projectId, assetId, displayName, passedImageIds };
    });

    console.log('Training Data:', JSON.stringify(data, null, 2));

    if (data.passedImageIds.length === 0) {
      console.log('Error: No passed images for training.');
      return;
    }

    // 3. API 호출 (학습 시작)
    const response = await axios.post('http://localhost:3001/api/visual/lora/train', {
      project_id: data.projectId,
      asset_id: data.assetId,
      asset_name: data.displayName,
      passed_image_ids: data.passedImageIds
    });

    console.log('API Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Error starting training:', err.message);
    if (err.response) console.error('Response details:', err.response.data);
  } finally {
    await closeDbPool();
  }
}

startTraining();
