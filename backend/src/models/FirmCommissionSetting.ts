import mongoose, { Schema } from 'mongoose';

const FirmCommissionSettingSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  FirmaId: { type: String },
  KiralamaKomisyonOrani: { type: Number },
  KiralamaKdv: { type: Number },
  KiralamaDepozitoSiniri: { type: Number },
  KiralamaPesinKira: { type: Number },
  KiralamaKaporaTipi: { type: String },
  SatisAliciKomisyon: { type: Number },
  SatisSaticiKomisyon: { type: Number },
  TapuHarciAlici: { type: Number },
  TapuHarciSatici: { type: Number },
  DonerSermayeBedeli: { type: Number },
  SatisKaporaOrani: { type: Number },
  DisOfisPortfoyPayi: { type: Number },
  DisOfisMusteriPayi: { type: Number },
  IciPortfoyPayi: { type: Number },
  IciMusteriPayi: { type: Number },
  BrokerDanismanPayi: { type: Number },
  BrokerOfisPayi: { type: Number },
  KademeliDanismanPayi: { type: Number },
  KademeliOfisPayi: { type: Number },
  MasaUcretiTutar: { type: Number },
  MasaDanismanPayi: { type: Number },
  GuncellemeTarihi: { type: Date },
  YetkilendirmeSarti: { type: Boolean },
}, { 
  collection: 'FirmaKomisyonAyarlari',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

FirmCommissionSettingSchema.virtual('Id').get(function() { return this._id; });

export const FirmCommissionSetting = mongoose.models.FirmCommissionSetting || mongoose.model('FirmCommissionSetting', FirmCommissionSettingSchema);
