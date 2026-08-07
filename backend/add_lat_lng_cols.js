const { sql, poolPromise } = require('./dist/config/db');

async function addCols() {
  try {
    const pool = await poolPromise;
    console.log("Connected to DB, adding columns...");

    await pool.request().query(`
      IF COL_LENGTH('Portfoyler', 'Latitude') IS NULL
      BEGIN
        ALTER TABLE Portfoyler ADD Latitude FLOAT NULL;
      END

      IF COL_LENGTH('Portfoyler', 'Longitude') IS NULL
      BEGIN
        ALTER TABLE Portfoyler ADD Longitude FLOAT NULL;
      END
    `);
    
    console.log("Columns Latitude and Longitude checked/added successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error adding columns:", err);
    process.exit(1);
  }
}

addCols();
