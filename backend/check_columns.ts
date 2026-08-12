const { sql, poolPromise } = require('./src/config/db');

async function check() {
  try {
    const pool = await poolPromise;
    const result1 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Kullanicilar'");
    console.log("Kullanicilar columns:", result1.recordset.map(r => r.COLUMN_NAME).join(', '));
    const result2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Portfoyler'");
    console.log("Portfoyler columns:", result2.recordset.map(r => r.COLUMN_NAME).join(', '));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
