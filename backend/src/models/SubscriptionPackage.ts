import mongoose, { Schema } from 'mongoose';

const SubscriptionPackageSchema = new Schema({
  _id: { type: Number }, // Original ID field mapped to _id
  PaketAdi: { type: String },
  CalisanKotasi: { type: Number },
  DenemeSuresiGun: { type: Number },
  IsActive: { type: Boolean },
}, { 
  collection: 'AbonelikPaketleri',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

SubscriptionPackageSchema.virtual('PaketID').get(function() { return this._id; });

export const SubscriptionPackage = mongoose.models.SubscriptionPackage || mongoose.model('SubscriptionPackage', SubscriptionPackageSchema);
