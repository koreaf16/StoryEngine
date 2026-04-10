/**
 * @file app/schemaSync.js
 * @description 서버 시작 시 필수 Oracle 컬럼/테이블 존재 여부를 점검하고 누락 시 추가.
 * @usage backend/server.js startup 단계에서 사용.
 * @connects app/database.js
 * @doc docs/06-database.md
 */
const { withConnection } = require('./database');
const { logInfo } = require('./logger');

const REQUIRED_EPISODE_COLUMNS = {
  SKELETON_JSON: 'CLOB',
  NOVEL_TEXT: 'CLOB',
};

const REQUIRED_ASSET_COLUMNS = {
  ANCHOR_IMAGE_ID: 'VARCHAR2(255)',
  ANCHOR_EMBEDDING: 'CLOB',
  TRIGGER_WORD: 'VARCHAR2(100)',
  LORA_PATH: 'VARCHAR2(255)',
  OUTFIT_PROMPT: 'VARCHAR2(1000)',
  OUTFIT_ANCHOR_ID: 'VARCHAR2(100)',
  IS_PROTAGONIST: 'NUMBER(1) DEFAULT 0',
};

const REQUIRED_SHOT_COLUMNS = {
  VIDEO_PROMPT: 'CLOB',
};

const REQUIRED_PROJECT_COLUMNS = {
  SEED: 'CLOB',
  VISUAL_STYLE: "VARCHAR2(30) DEFAULT 'PHOTOREALISTIC'",
  WORLD_BACKBONE: 'CLOB',
};

async function ensureProjectColumns() {
  await withConnection(async (conn) => {
    const result = await conn.execute(
      'SELECT column_name FROM user_tab_columns WHERE table_name = :1',
      ['PROJECTS']
    );
    const existingColumns = new Set(result.rows.map(([columnName]) => columnName));

    for (const [columnName, columnType] of Object.entries(REQUIRED_PROJECT_COLUMNS)) {
      if (existingColumns.has(columnName)) continue;
      await conn.execute(`ALTER TABLE projects ADD (${columnName} ${columnType})`);
      logInfo('schemaSync.projects', 'Added missing projects column', { columnName });
    }

    await conn.commit();
  });
}

async function ensureAssetsColumns() {
  await withConnection(async (conn) => {
    const result = await conn.execute(
      'SELECT column_name FROM user_tab_columns WHERE table_name = :1',
      ['ASSETS']
    );
    const existingColumns = new Set(result.rows.map(([columnName]) => columnName));

    for (const [columnName, columnType] of Object.entries(REQUIRED_ASSET_COLUMNS)) {
      if (existingColumns.has(columnName)) continue;
      await conn.execute(`ALTER TABLE assets ADD (${columnName} ${columnType})`);
      logInfo('schemaSync.assets', 'Added missing assets column', { columnName });
    }

    await conn.commit();
  });
}

async function ensureEpisodeColumns() {
  await withConnection(async (conn) => {
    const result = await conn.execute(
      'SELECT column_name FROM user_tab_columns WHERE table_name = :1',
      ['EPISODES']
    );
    const existingColumns = new Set(result.rows.map(([columnName]) => columnName));

    for (const [columnName, columnType] of Object.entries(REQUIRED_EPISODE_COLUMNS)) {
      if (existingColumns.has(columnName)) continue;
      await conn.execute(`ALTER TABLE episodes ADD (${columnName} ${columnType})`);
      logInfo('schemaSync.episodes', 'Added missing episodes column', { columnName });
    }

    await conn.commit();
  });
}

async function ensureShotColumns() {
  await withConnection(async (conn) => {
    const result = await conn.execute(
      'SELECT column_name FROM user_tab_columns WHERE table_name = :1',
      ['SHOTS']
    );
    const existingColumns = new Set(result.rows.map(([columnName]) => columnName));

    for (const [columnName, columnType] of Object.entries(REQUIRED_SHOT_COLUMNS)) {
      if (existingColumns.has(columnName)) continue;
      await conn.execute(`ALTER TABLE shots ADD (${columnName} ${columnType})`);
      logInfo('schemaSync.shots', 'Added missing shots column', { columnName });
    }

    await conn.commit();
  });
}

async function ensureMemoryTables() {
  await withConnection(async (conn) => {
    const result = await conn.execute('SELECT table_name FROM user_tables');
    const existingTables = new Set(result.rows.map(([t]) => t));

    if (!existingTables.has('SCENE_VECTORS')) {
      await conn.execute(`
        CREATE TABLE scene_vectors (
          vector_id     VARCHAR2(100) PRIMARY KEY,
          project_id    VARCHAR2(100) NOT NULL,
          episode_id    VARCHAR2(100),
          scene_number  NUMBER,
          summary_text  CLOB,
          embedding     CLOB,
          created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logInfo('schemaSync.memory', 'Created scene_vectors table');
    }

    if (!existingTables.has('STORY_NODES')) {
      await conn.execute(`
        CREATE TABLE story_nodes (
          node_id     VARCHAR2(100) PRIMARY KEY,
          project_id  VARCHAR2(100) NOT NULL,
          episode_id  VARCHAR2(100),
          node_type   VARCHAR2(30),
          label       VARCHAR2(200),
          properties  CLOB,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logInfo('schemaSync.memory', 'Created story_nodes table');
    }

    if (!existingTables.has('STORY_EDGES')) {
      await conn.execute(`
        CREATE TABLE story_edges (
          edge_id        VARCHAR2(100) PRIMARY KEY,
          project_id     VARCHAR2(100) NOT NULL,
          episode_id     VARCHAR2(100),
          source_node_id VARCHAR2(100),
          target_node_id VARCHAR2(100),
          edge_type      VARCHAR2(50),
          weight         NUMBER DEFAULT 1,
          properties     CLOB,
          created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logInfo('schemaSync.memory', 'Created story_edges table');
    }

    await conn.commit();
  });
}

module.exports = {
  ensureProjectColumns,
  ensureAssetsColumns,
  ensureEpisodeColumns,
  ensureShotColumns,
  ensureMemoryTables,
};
