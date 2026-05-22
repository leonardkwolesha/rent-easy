const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: { type: String, enum: ['order', 'wallet-topup'], default: 'order' },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ['mpesa', 'airtel', 'tigo', 'mixx', 'halotel', 'cash', 'wallet', 'card'],
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    reference: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
