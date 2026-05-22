const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  transactionFeeRate: { type: Number, default: 2.5, min: 0, max: 20 }, // % of each paid rent
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
