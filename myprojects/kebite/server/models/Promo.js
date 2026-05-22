const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discount: { type: Number, required: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    minOrder: { type: Number, default: 0 },
    expiry: Date,
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Promo', promoSchema);
