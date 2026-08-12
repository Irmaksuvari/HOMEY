import mongoose, { Schema } from 'mongoose';

const ProcessStageSchema = new Schema({
  _id: { type: Number }, // Original ID field mapped to _id
  Baslik: { type: String },
  SiraNo: { type: Number },
  RenkKodu: { type: String },
  IsActive: { type: Boolean },
}, { 
  collection: 'SurecAsamalari',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: false // Allow extra fields dynamically during migration
});

ProcessStageSchema.virtual('Id').get(function() { return this._id; });

export const ProcessStage = mongoose.models.ProcessStage || mongoose.model('ProcessStage', ProcessStageSchema);
