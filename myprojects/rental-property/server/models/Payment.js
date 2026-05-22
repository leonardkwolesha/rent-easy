const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  lease: { type: mongoose.Schema.Types.ObjectId, ref: 'Lease', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['rent', 'deposit', 'penalty', 'other'], default: 'rent' },
  status: { type: String, enum: ['pending', 'paid', 'overdue', 'waived'], default: 'pending' },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  paymentMethod: { type: String, enum: ['mpesa', 'airtel', 'mixx', 'halotel', 'bank', 'cash', 'card'] },
  gatewayRef: { type: String },
  transactionId: { type: String },
  note: { type: String },
  period: { type: String },
  platformFeeRate: { type: Number, default: 0 },   // fee % applied at time of payment
  platformFee:     { type: Number, default: 0 },   // owner's earnings from this payment
  netToLandlord:   { type: Number, default: 0 },   // amount landlord receives (amount - fee)
}, { timestamps: true });

paymentSchema.index({ lease: 1, period: 1 });
paymentSchema.index({ tenant: 1, status: 1 });
paymentSchema.index({ landlord: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
