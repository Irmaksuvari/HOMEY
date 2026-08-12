const mongoose = require('mongoose');
require('dotenv').config();
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const result = await db.collection('PortfoyFotograflari').updateMany(
    { PortfoyID: { $exists: true } },
    { $rename: { 'PortfoyID': 'PortfoyId' } }
  );
  console.log('Renamed fields:', result.modifiedCount);
  process.exit(0);
}
check();
