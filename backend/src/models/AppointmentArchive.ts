import mongoose, { Schema } from 'mongoose';

const AppointmentArchiveSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  PortfoyId: { type: String },
  TeklifEdenUzmanId: { type: String },
  MusteriId: { type: String },
  RandevuZamani: { type: Date },
  Durum: { type: String },
  KayitTarihi: { type: Date },
}, { 
  collection: 'RandevularArsivi',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

AppointmentArchiveSchema.virtual('Id').get(function() { return this._id; });

export const AppointmentArchive = mongoose.models.AppointmentArchive || mongoose.model('AppointmentArchive', AppointmentArchiveSchema);
