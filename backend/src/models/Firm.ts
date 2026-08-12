import mongoose, { Schema } from 'mongoose';

const FirmSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  FirmaAdi: { type: String },
  VergiNo: { type: String },
  Sehir: { type: String },
  PaketTipi: { type: String },
  AbonelikTipi: { type: String },
  AbonelikBitisTarihi: { type: Date },
  KayitTarihi: { type: Date },
}, { 
  collection: 'Firmalar',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

FirmSchema.virtual('Id').get(function() { return this._id; });

export const Firm = mongoose.models.Firm || mongoose.model('Firm', FirmSchema);
