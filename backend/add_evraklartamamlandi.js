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
  console.log("Connected to DB. Starting migration for MusteriSurecleri EvraklarTamamlandi...");
  
  return pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'MusteriSurecleri' AND COLUMN_NAME = 'EvraklarTamamlandi'
    )
    BEGIN
      ALTER TABLE MusteriSurecleri ADD EvraklarTamamlandi BIT NOT NULL DEFAULT 0;
      PRINT 'Column EvraklarTamamlandi added.';
    END
    ELSE
    BEGIN
      PRINT 'Column EvraklarTamamlandi already exists.';
    END
  `);
}).then(() => {
  console.log("Migration complete.");
  process.exit(0);
}).catch(e => {
  console.error("Migration failed:", e);
  process.exit(1);
});
