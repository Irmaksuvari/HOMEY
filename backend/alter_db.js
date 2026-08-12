const { sql, poolPromise } = require('./src/config/db');

async function alterTable() {
  try {
    const pool = await poolPromise;
    console.log("Checking if SilindiMi exists...");
    const checkQuery = `
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID('Kullanicilar') 
        AND name = 'SilindiMi'
      )
      BEGIN
        ALTER TABLE Kullanicilar ADD SilindiMi BIT DEFAULT 0;
        PRINT 'SilindiMi column added.';
      END
      ELSE
      BEGIN
        PRINT 'SilindiMi column already exists.';
      END
    `;
    await pool.request().query(checkQuery);
    
    // Also check if we need to update existing rows to 0
    await pool.request().query("UPDATE Kullanicilar SET SilindiMi = 0 WHERE SilindiMi IS NULL");

    console.log("Success!");
    process.exit(0);
  } catch (error) {
    console.error("Error modifying database:", error);
    process.exit(1);
  }
}

alterTable();
