import mongoose, { Schema } from 'mongoose';

const FirmSubscriptionSchema = new Schema({
  _id: { type: Number }, // Original ID field mapped to _id
  Periyot: { type: String },
  BaslangicTarihi: { type: Date },
  BitisTarihi: { type: Date },
  Durum: { type: String },
  FirmaID: { type: String },
  GelecekPaketID: { type: Number },
  GelecekPeriyot: { type: String },
}, { 
  collection: 'FirmaAbonelikleri',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

FirmSubscriptionSchema.virtual('AbonelikID').get(function() { return this._id; });
FirmSubscriptionSchema.virtual('PaketID').get(function() { return this._id; });

export const FirmSubscription = mongoose.models.FirmSubscription || mongoose.model('FirmSubscription', FirmSubscriptionSchema);
