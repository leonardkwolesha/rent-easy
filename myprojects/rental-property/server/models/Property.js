const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['apartment', 'house', 'studio', 'villa', 'room', 'commercial'],
    required: true,
  },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  address: {
    street: { type: String, required: true },
    area: { type: String },
    city: { type: String, required: true },
    country: { type: String, default: 'Tanzania' },
  },
  coordinates: { lat: Number, lng: Number },
  rent: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'TZS' },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  },
  deposit: { type: Number, default: 0 },
  bedrooms: { type: Number, default: 0 },
  bathrooms: { type: Number, default: 1 },
  area_sqm: { type: Number },
  amenities: [String],
  images: [String],
  status: { type: String, enum: ['available', 'occupied', 'unavailable'], default: 'available' },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

propertySchema.index({ 'address.city': 1, status: 1 });
propertySchema.index({ landlord: 1 });

module.exports = mongoose.model('Property', propertySchema);
