const { withConnection, closeDbPool } = require('./app/database');
const { logError } = require('./app/logger');

async function querySoyul() {
  try {
    await withConnection(async (conn) => {
      // 1. 에셋 정보 조회
      const assetRes = await conn.execute(
        `SELECT asset_id, display_name, pipeline_status, created_at, is_protagonist, audio_type
         FROM assets
         WHERE display_name = '한소율' OR asset_id LIKE '%soyul%'`
      );
      console.log('--- Assets ---');
      console.table(assetRes.rows.map(r => ({
        id: r[0], name: r[1], status: r[2], created: r[3], protagonist: r[4], audio: r[5]
      })));

      if (assetRes.rows.length > 0) {
        const assetId = assetRes.rows[0][0];

        // 2. 파이프라인 에러/성공 로그
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
