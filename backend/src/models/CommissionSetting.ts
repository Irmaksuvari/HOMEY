import mongoose, { Schema } from 'mongoose';

const CommissionSettingSchema = new Schema({
  FirmaId: { type: String },
  SenaryoA_OfisYuzde: { type: Number },
  SenaryoA_DanismanYuzde: { type: Number },
  SenaryoB_OfisYuzde: { type: Number },
  SenaryoB_PortfoySahibiYuzde: { type: Number },
  SenaryoB_MusteriGetirenYuzde: { type: Number },
  SenaryoC_DisOrtakYuzde: { type: Number },
  SenaryoC_OfisYuzde: { type: Number },
  SenaryoC_DanismanYuzde: { type: Number },
}, { 
  collection: 'KomisyonAyarlari',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});


export const CommissionSetting = mongoose.models.CommissionSetting || mongoose.model('CommissionSetting', CommissionSettingSchema);
