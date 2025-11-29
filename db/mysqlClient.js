const mysql = require('mysql2/promise');

function createMySQLClient(config) {
  let pool;

  async function init() {
    pool = mysql.createPool({
      host: config.host || `localhost`, 
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: 5
    });

    // test connection
    await pool.query('SELECT 1');
    return api;
  }

  const api = {
    async query(sql) {
      const [rows] = await pool.query(sql);
      return rows;
    },
    async getSchema() {
      // You can tune this (limit to current DB, etc.)
      const [tables] = await pool.query(`
       SELECT
    c.TABLE_NAME,
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.COLUMN_TYPE,         
    c.IS_NULLABLE,
    c.COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME not like "%Udf%"
ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION;
`);

      const schemaByTable = {};
      for (const row of tables) {
        if (!schemaByTable[row.TABLE_NAME]) schemaByTable[row.TABLE_NAME] = [];
        schemaByTable[row.TABLE_NAME].push({
          column: row.COLUMN_NAME,
          type: row.DATA_TYPE,
          columnType: row.COLUMN_TYPE,
          isNullable: row.IS_NULLABLE,
          columnKey: row.COLUMN_KEY
        });
      }
      return schemaByTable;
    },
    async close() {
      if (pool) await pool.end();
    }
  };

  return init();
}

module.exports = { createMySQLClient };
