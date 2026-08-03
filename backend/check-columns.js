const sql = require('mssql');
require('dotenv').config({ path: '.env' });
const config = {
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, database: process.env.DB_DATABASE || process.env.DB_NAME,
  options: { encrypt: process.env.DB_ENCRYPT === 'true', trustServerCertificate: true }, port: 1433
};
sql.connect(config).then(pool => {
  return pool.request().query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('Musteriler','Kullanicilar') ORDER BY TABLE_NAME, ORDINAL_POSITION`);
}).then(r => {
  const byTable = {};
  r.recordset.forEach(c => {
    // Hangi tabloya ait? - sorguda TABLE_NAME ekleyelim
  });
  
  // Tekrar sorgula - TABLE_NAME dahil
  return sql.connect(config).then(pool2 => {
    return pool2.request().query(`SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('Musteriler','Kullanicilar') ORDER BY TABLE_NAME, ORDINAL_POSITION`);
  }).then(r2 => {
    const tables = {};
    r2.recordset.forEach(c => {
      if (!tables[c.TABLE_NAME]) tables[c.TABLE_NAME] = [];
      tables[c.TABLE_NAME].push(c.COLUMN_NAME);
    });
    Object.entries(tables).forEach(([tbl, cols]) => {
      console.log(`\n${tbl} sütunları:\n  ${cols.join(', ')}`);
    });
    sql.close();
  });
}).catch(e => console.error('❌', e.message));
