import mongoose, { Schema } from 'mongoose';

const PackagePriceSchema = new Schema({
  _id: { type: Number }, // Original ID field mapped to _id
  Periyot: { type: String },
  Fiyat: { type: Number },
  IsActive: { type: Boolean },
}, { 
  collection: 'PaketFiyatlari',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

PackagePriceSchema.virtual('FiyatID').get(function() { return this._id; });
PackagePriceSchema.virtual('PaketID').get(function() { return this._id; });

export const PackagePrice = mongoose.models.PackagePrice || mongoose.model('PackagePrice', PackagePriceSchema);
