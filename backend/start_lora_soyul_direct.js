const { startLoraTraining, getLoraStatus } = require('./features/visual/lora/service');
const { withConnection, closeDbPool } = require('./app/database');

async function directStart() {
  try {
    const data = await withConnection(async (conn) => {
      const assetRes = await conn.execute(
        `SELECT project_id, asset_id, display_name FROM assets WHERE asset_id = 'han_soyul'`
      );
      if (assetRes.rows.length === 0) throw new Error('Asset not found');
      const [projectId, assetId, displayName] = assetRes.rows[0];

      const imageRes = await conn.execute(
        `SELECT f.file_id
         FROM system_files f
         JOIN asset_derived_images d ON f.file_id = d.image_id
         WHERE f.asset_id = :1`,
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

    const result = await startLoraTraining(
      data.projectId,
      data.assetId,
      data.displayName,
      data.passedImageIds
    );

    console.log('Training triggered. Task ID:', result.task_id);

    // 완료 또는 오류까지 폴링 (최대 2시간)
    const taskId = result.task_id;
    const deadline = Date.now() + 2 * 60 * 60 * 1000;
    let lastStatus = '';

    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 5000));
      const status = getLoraStatus(taskId);
      if (!status) break;

      const line = `[${status.status}] progress=${(status.progress * 100).toFixed(1)}% step=${status.stepValue}/${status.stepMax}`;
      if (line !== lastStatus) {
        console.log(line);
        lastStatus = line;
      }

      if (['done', 'error', 'cancelled'].includes(status.status)) {
        if (status.status === 'done') {
          console.log('✓ Training complete. loraPath:', status.loraPath);
          console.log('  triggerWord:', status.triggerWord);
        } else {
          console.error('✗ Training failed:', status.error);
        }
        break;
      }
    }
  } catch (err) {
    console.error('Error:', err.stack || err.message);
  } finally {
    await closeDbPool();
  }
}

directStart();
