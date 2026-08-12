import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  _id: { type: String }, // Original ID field mapped to _id
  FirmaId: { type: String },
  Ad: { type: String },
  Soyad: { type: String },
  Eposta: { type: String },
  SifreHash: { type: String },
  Telefon: { type: String },
  Rol: { type: String },
  IlkGirisMi: { type: Boolean },
  AktifMi: { type: Boolean },
  KayitTarihi: { type: Date },
  OfisteMi: { type: Boolean },
  ProfilFoto: { type: String },
  TemaTercihi: { type: String },
  SilindiMi: { type: Boolean },
  ResetToken: { type: String },
  ResetTokenExpires: { type: Date },
}, { 
  collection: 'Kullanicilar',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

UserSchema.virtual('Id').get(function() { return this._id; });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
