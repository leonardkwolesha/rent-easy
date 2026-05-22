const mongoose = require('mongoose');

const leaseSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rentAmount: { type: Number, required: true },
  depositAmount: { type: Number, default: 0 },
  depositPaid: { type: Boolean, default: false },
  paymentDay: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'expired', 'terminated'], default: 'active' },
  terminationReason: { type: String },
  terminatedAt: { type: Date },
  terms: { type: String },
}, { timestamps: true });

leaseSchema.index({ tenant: 1, status: 1 });
leaseSchema.index({ property: 1 });
leaseSchema.index({ landlord: 1 });

module.exports = mongoose.model('Lease', leaseSchema);
