import mongoose, { Schema } from 'mongoose';

const FirmDocumentSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  FirmaId: { type: String },
  KiraKontratSablonu: { type: String },
  TahliyeTaahhutnamesiSablonu: { type: String },
  SenetSablonu: { type: String },
  OnSatisSozlesmesiSablonu: { type: String },
  YetkilendirmeSozlesmesiSablonu: { type: String },
  OlusturulmaTarihi: { type: Date },
  GuncellemeTarihi: { type: Date },
}, { 
  collection: 'FirmaEvraklari',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

FirmDocumentSchema.virtual('Id').get(function() { return this._id; });

export const FirmDocument = mongoose.models.FirmDocument || mongoose.model('FirmDocument', FirmDocumentSchema);
