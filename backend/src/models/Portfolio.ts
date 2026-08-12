import mongoose, { Schema } from 'mongoose';

const PortfolioSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  FirmaId: { type: String },
  GorevliUzmanId: { type: String },
  Tip: { type: String },
  Tur: { type: String },
  Fiyat: { type: Number },
  KaporaMiktari: { type: Number },
  DepozitoMiktari: { type: Number },
  Il: { type: String },
  Ilce: { type: String },
  Semt: { type: String },
  Mahalle: { type: String },
  Cadde: { type: String },
  Sokak: { type: String },
  EvSahibiAdi: { type: String },
  EvSahibiTelefon: { type: String },
  Durum: { type: String },
  KayitTarihi: { type: Date },
  Metrekare: { type: Number },
  OdaSayisi: { type: String },
  IsPublished: { type: Boolean },
  Aciklama: { type: String },
  HasAsansor: { type: Boolean },
  OtoparkTipi: { type: String },
  IsinmaTipi: { type: String },
  BalkonDurumu: { type: String },
  EsyaDurumu: { type: String },
  KullanimDurumu: { type: String },
  IsKrediyeUygun: { type: Boolean },
  TapuDurumu: { type: String },
  IsTakasaUygun: { type: Boolean },
  IsAcilSatilik: { type: Boolean },
  IsFiyatiDustu: { type: Boolean },
  YetkilendirmeSozlesmesiYapildi: { type: Boolean },
  MulkSahibiId: { type: String },
  Baslik: { type: String },
  Latitude: { type: Number },
  Longitude: { type: Number },
}, { 
  collection: 'Portfoyler',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

PortfolioSchema.virtual('Id').get(function() { return this._id; });

export const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', PortfolioSchema);
