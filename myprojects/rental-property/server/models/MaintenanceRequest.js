const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  lease: { type: mongoose.Schema.Types.ObjectId, ref: 'Lease', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'structural', 'appliance', 'pest', 'other'],
    default: 'other',
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  images: [String],
  landlordNote: { type: String },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
}, { timestamps: true });

maintenanceSchema.index({ property: 1 });
maintenanceSchema.index({ tenant: 1 });
maintenanceSchema.index({ landlord: 1, status: 1 });

module.exports = mongoose.model('MaintenanceRequest', maintenanceSchema);
