/**
 * @file database.js
 * @description Oracle Database (23ai) 연결 풀 관리 및 헬퍼 함수 제공.
 * @usage features 하위 라우터에서 DB 연결 필요 시 사용.
 * @connects app/config.js, oracledb
 * @doc docs/06-database.md
 */
const oracledb = require('oracledb');
const { ORACLE_USER, ORACLE_PASSWORD, ORACLE_DSN, ORACLE_INSTANT_CLIENT_PATH } = require('./config');
const fs = require('fs');
const { logWarn } = require('./logger');

let pool = null;

async function initDbPool() {
  if (pool) return pool;

  try {
    if (ORACLE_INSTANT_CLIENT_PATH && fs.existsSync(ORACLE_INSTANT_CLIENT_PATH)) {
      oracledb.initOracleClient({ libDir: ORACLE_INSTANT_CLIENT_PATH });
    }
  } catch (e) {
    // Thick mode 초기화 실패 시 thin mode로 진행
    logWarn('db.initOracleClient', 'Oracle Client init failed, using thin mode', { instantClientPath: ORACLE_INSTANT_CLIENT_PATH, error: e.message });
  }

  oracledb.fetchAsString = [oracledb.CLOB];

  pool = await oracledb.createPool({
    user: ORACLE_USER,
    password: ORACLE_PASSWORD,
    connectString: ORACLE_DSN,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
  });

  return pool;
}

/**
 * 커넥션을 획득하고 콜백을 실행 후 자동 반환.
 * @param {(conn: oracledb.Connection) => Promise<T>} fn
 */
async function withConnection(fn) {
  if (!pool) await initDbPool();
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    await conn.close();
  }
}

async function closeDbPool() {
  if (pool) {
    await pool.close(0);
    pool = null;
  }
}

module.exports = { initDbPool, withConnection, closeDbPool };

