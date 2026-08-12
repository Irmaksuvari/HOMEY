import mongoose, { Schema } from 'mongoose';

const AppointmentSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  PortfoyId: { type: String },
  TeklifEdenUzmanId: { type: String },
  MusteriId: { type: String },
  RandevuZamani: { type: Date },
  Durum: { type: String },
  KayitTarihi: { type: Date },
}, { 
  collection: 'Randevular',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

AppointmentSchema.virtual('Id').get(function() { return this._id; });

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
