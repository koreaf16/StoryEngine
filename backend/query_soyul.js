const { withConnection, closeDbPool } = require('./app/database');
const { logInfo, logError } = require('./app/logger');

async function querySoyul() {
  try {
    await withConnection(async (conn) => {
      // 1. 에셋 정보 조회
      const assetRes = await conn.execute(
        `SELECT asset_id, display_name, trigger_word, lora_path, pipeline_status, created_at
         FROM assets
         WHERE display_name = '한소율' OR asset_id LIKE '%soyul%'`
      );
      console.log('--- Assets ---');
      console.table(assetRes.rows.map(r => ({
        id: r[0], name: r[1], trigger: r[2], path: r[3], status: r[4], created: r[5]
      })));

      if (assetRes.rows.length > 0) {
        const assetId = assetRes.rows[0][0];
        // 2. LoRA 버전 이력 조회
        const versionRes = await conn.execute(
          `SELECT version_id, training_steps, created_at
           FROM asset_versions
           WHERE asset_id = :1
           ORDER BY created_at DESC`,
          [assetId]
        );
        console.log('--- Versions ---');
        console.table(versionRes.rows.map(r => ({
          id: r[0], steps: r[1], created: r[2]
        })));

        // 3. 파이프라인 에러/성공 로그 (있다면)
        const errorRes = await conn.execute(
          `SELECT phase, stage, error_type, created_at
           FROM pipeline_errors
           WHERE entity_id = :1
           ORDER BY created_at DESC`,
          [assetId]
        );
        console.log('--- Errors ---');
        console.table(errorRes.rows.map(r => ({
          phase: r[0], stage: r[1], type: r[2], created: r[3]
        })));
      }
    });
  } catch (err) {
    logError('querySoyul', err);
  } finally {
    await closeDbPool();
  }
}

querySoyul();
