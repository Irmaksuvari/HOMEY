import mongoose, { Schema } from 'mongoose';

const ClientSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  FirmaId: { type: String },
  KayitEdenUzmanId: { type: String },
  Ad: { type: String },
  Soyad: { type: String },
  Telefon: { type: String },
  AradigiButce: { type: Number },
  AradigiEmlakTipi: { type: String },
  KayitTarihi: { type: Date },
  Müşteri_Tipi: { type: String },
  IsActive: { type: Boolean },
  is_active: { type: Boolean },
}, { 
  collection: 'Musteriler',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

ClientSchema.virtual('Id').get(function() { return this._id; });

export const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);
