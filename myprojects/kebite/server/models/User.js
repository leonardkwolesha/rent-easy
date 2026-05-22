const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    googleId: { type: String, default: null, index: true, sparse: true },
    role: {
      type: String,
      enum: ['customer', 'restaurant', 'rider', 'admin'],
      default: 'customer',
      required: true,
    },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
    isAvailable: { type: Boolean, default: false },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    vehicleType: { type: String, enum: ['bicycle', 'motorcycle', 'car'], default: 'motorcycle' },
    licenseNumber: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    documents: [{ type: String }],
    addresses: [
      {
        label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
        street: String,
        area: String,
        city: String,
      },
    ],
    walletBalance: { type: Number, default: 0 },
    subscription: { type: String, default: 'free' },
    notifications: { type: Boolean, default: true },
    notificationPrefs: {
      sms:      { type: Boolean, default: true },
      email:    { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
    },
    language: { type: String, enum: ['en', 'sw'], default: 'en' },
    avatar: { type: String, default: null },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
