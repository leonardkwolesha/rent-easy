const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  message: { type: String },
  moveInDate: { type: Date },
  employmentStatus: { type: String, enum: ['employed', 'self-employed', 'student', 'other'] },
  monthlyIncome: { type: Number },
  documents: [String],
  rejectionReason: { type: String },
  reviewedAt: { type: Date },
}, { timestamps: true });

applicationSchema.index({ property: 1, tenant: 1 }, { unique: true });
applicationSchema.index({ tenant: 1 });
applicationSchema.index({ property: 1 });

module.exports = mongoose.model('Application', applicationSchema);
