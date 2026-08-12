const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true }
};

async function getDBStructure() {
  try {
    const pool = await sql.connect(config);
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    const schema = {};
    for (let i = 0; i < tablesResult.recordset.length; i++) {
      const tableName = tablesResult.recordset[i].TABLE_NAME;
      const colsResult = await pool.request().input('tableName', sql.NVarChar, tableName).query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tableName
      `);
      schema[tableName] = colsResult.recordset;
    }
    
    require('fs').writeFileSync('schema_dump.json', JSON.stringify(schema, null, 2));
    console.log("Schema dumped to schema_dump.json");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

getDBStructure();
