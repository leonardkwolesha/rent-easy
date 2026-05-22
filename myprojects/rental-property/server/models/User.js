const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['tenant', 'landlord', 'agent', 'admin'], default: 'tenant' },
  phone: { type: String },
  avatar: { type: String },
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  licenseNumber: { type: String },
  agencyName: { type: String },
  resetToken: { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
