import mongoose, { Schema } from 'mongoose';

const SaleSchema = new Schema({
  _id: { type: Number }, // Original ID field mapped to _id
  PortfoyID: { type: String },
  DanismanID: { type: String },
  IslemTuru: { type: String },
  IslemBedeli: { type: Number },
  HizmetBedeliCiro: { type: Number },
  IslemTarihi: { type: Date },
  Aciklama: { type: String },
  AliciMusteriID: { type: String },
}, { 
  collection: 'SatisIslemleri',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

SaleSchema.virtual('IslemID').get(function() { return this._id; });

export const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
