import mongoose, { Schema } from 'mongoose';

const ClientProcessSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  MusteriId: { type: String },
  PortfoyId: { type: String },
  RandevuId: { type: String },
  AsamaId: { type: Number },
  SonTakipTarihi: { type: Date },
  Notlar: { type: String },
  OlusturmaTarihi: { type: Date },
  GuncellemeTarihi: { type: Date },
  AsamaAdi: { type: String },
  DanismanId: { type: String },
  FirmaId: { type: String },
  Aciklama: { type: String },
  EvraklarTamamlandi: { type: Boolean },
}, { 
  collection: 'MusteriSurecleri',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

ClientProcessSchema.virtual('Id').get(function() { return this._id; });

export const ClientProcess = mongoose.models.ClientProcess || mongoose.model('ClientProcess', ClientProcessSchema);
