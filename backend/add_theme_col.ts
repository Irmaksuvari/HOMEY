import { getPool } from './src/config/db';

async function run() {
  try {
    const pool = await getPool();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Kullanicilar') AND name = 'TemaTercihi')
      BEGIN
        ALTER TABLE Kullanicilar ADD TemaTercihi NVARCHAR(20) DEFAULT 'system';
      END
    `);
    console.log("Column TemaTercihi added to Kullanicilar table successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error adding column:", err);
    process.exit(1);
  }
}

run();
