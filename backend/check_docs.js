const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true }
};

sql.connect(config).then(pool => {
  return pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Evrak%' OR TABLE_NAME LIKE '%Belge%'");
}).then(r => {
  console.log(r.recordset);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
