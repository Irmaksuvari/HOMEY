import mongoose, { Schema } from 'mongoose';

const PortfolioPhotoSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  PortfoyId: { type: String },
  FotoUrl: { type: String },
  Sira: { type: Number },
}, { 
  collection: 'PortfoyFotograflari',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

PortfolioPhotoSchema.virtual('Id').get(function() { return this._id; });

export const PortfolioPhoto = mongoose.models.PortfolioPhoto || mongoose.model('PortfolioPhoto', PortfolioPhotoSchema);
