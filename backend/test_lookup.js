const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const docs = await db.collection('Portfoyler').aggregate([
    { $lookup: { from: 'Kullanicilar', localField: 'GorevliUzmanId', foreignField: '_id', as: 'Uzman' } }
  ]).toArray();
  
  console.log(docs[0].Uzman);
  
  const photoDocs = await db.collection('PortfoyFotograflari').aggregate([
    { $lookup: { from: 'Portfoyler', localField: 'PortfoyID', foreignField: '_id', as: 'Portfoy' } }
  ]).toArray();
  
  console.log("Photo lookup Portfoyler:", photoDocs[0].Portfoy);
  process.exit(0);
}
check();
