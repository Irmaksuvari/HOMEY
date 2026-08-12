const sql = require('mssql');
const mongoose = require('mongoose');
require('dotenv').config();

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

const tables = [
  'Portfoyler', 'PortfoyFotograflari', 'KomisyonAyarlari', 'Randevular', 
  'RandevularArsivi', 'AbonelikPaketleri', 'PaketFiyatlari', 'SurecAsamalari', 
  'FirmaAbonelikleri', 'MusteriSurecleri', 'SatisIslemleri', 'Firmalar', 
  'Kullanicilar', 'FirmaEvraklari', 'FirmaKomisyonAyarlari', 'Musteriler'
];

// Helper to rename 'Id' to '_id' for MongoDB, or keep existing fields if no 'Id' exists.
function mapRecord(record) {
  const mapped = { ...record };
  if (mapped.Id) {
    mapped._id = String(mapped.Id).toLowerCase(); // Normalize UUID
    delete mapped.Id;
  }
  return mapped;
}

async function runMigration() {
  console.log('Connecting to Azure SQL...');
  const pool = await sql.connect(sqlConfig);
  console.log('Connected to Azure SQL.');

  const mongoUri = process.env.MONGODB_URI;
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;

  for (const tableName of tables) {
    try {
      console.log(`Migrating table: ${tableName}...`);
      const result = await pool.request().query(`SELECT * FROM ${tableName}`);
      const records = result.recordset;

      if (records.length === 0) {
        console.log(`  - No records found for ${tableName}. Skipping.`);
        continue;
      }

      const collection = db.collection(tableName);
      // Clear existing just in case
      await collection.deleteMany({});
      
      const mappedRecords = records.map(mapRecord);
      await collection.insertMany(mappedRecords);

      console.log(`  - Successfully migrated ${records.length} records to ${tableName} collection.`);
    } catch (err) {
      console.error(`  - Error migrating table ${tableName}:`, err.message);
    }
  }

  console.log('Migration completed successfully.');
  await sql.close();
  await mongoose.disconnect();
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
