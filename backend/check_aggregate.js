const mongoose = require('mongoose');
require('dotenv').config();
async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const firmaId = '3069f59e-75ed-4f73-9812-dfe92e9a6f6d';
  const userId = 'b420a1c0-cfbf-4c84-b68a-68bd75ad316d';
  const docs = await db.collection('MusteriSurecleri').aggregate([
      { $lookup: { from: 'Musteriler', localField: 'MusteriId', foreignField: '_id', as: 'Musteri' } },
      { $unwind: { path: '$Musteri', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Portfoyler', localField: 'PortfoyId', foreignField: '_id', as: 'Portfoy' } },
      { $unwind: { path: '$Portfoy', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Musteriler', localField: 'Portfoy.MulkSahibiId', foreignField: '_id', as: 'MulkSahibi' } },
      { $unwind: { path: '$MulkSahibi', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'Kullanicilar', localField: 'DanismanId', foreignField: '_id', as: 'Danisman' } },
      { $unwind: { path: '$Danisman', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [ { FirmaId: firmaId }, { 'Portfoy.FirmaId': firmaId } ],
          $and: [ { $or: [ { DanismanId: userId }, { 'Portfoy.GorevliUzmanId': userId } ] } ]
        }
      },
      {
        $project: {
          _id: 1, AsamaId: 1, portfoyTur: '$Portfoy.Tur', DanismanId: 1, FirmaId: 1,
          portfoyFirma: '$Portfoy.FirmaId', portfoyUzman: '$Portfoy.GorevliUzmanId'
        }
      }
    ]).toArray();
  console.log(docs);
  process.exit(0);
}
check();
