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
  return pool.request().query("SELECT YetkilendirmeSarti FROM FirmaKomisyonAyarlari");
}).then(r => {
  console.log(r.recordset);
  process.exit();
}).catch(console.error);
