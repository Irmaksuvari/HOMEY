import { getPool } from './src/config/db';

async function run() {
  try {
    const pool = await getPool();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Portfoyler') AND name = 'Baslik')
      BEGIN
        ALTER TABLE Portfoyler ADD Baslik NVARCHAR(255) NULL;
      END
    `);
    console.log("Column Baslik added to Portfoyler table successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error adding column:", err);
    process.exit(1);
  }
}

run();
