const { initDbPool, closeDbPool } = require('./app/database');
const { logError, logInfo } = require('./app/logger');

(async () => {
  try {
    const { withConnection } = require('./app/database');
    const result = await withConnection(async (conn) => {
      const r = await conn.execute(`
        SELECT project_id, title, seed FROM projects WHERE project_id = 'p_e77f14e1'
      `);
      return r;
    });
    
    logInfo('testSeed', 'Seed data fetched');
    for (const row of result.rows) {
      logInfo('testSeed.row', 'Project row', { id: row[0], title: row[1], seedType: typeof row[2] });
      if (row[2]) {
        logInfo('testSeed.row', 'Seed length', { id: row[0], seedLength: row[2].length || null });
      }
    }

    await closeDbPool();
  } catch (e) {
    logError('testSeed', e);
    process.exit(1);
  }
})();
