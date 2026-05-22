const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    currentLocation: {
      lat: Number,
      lng: Number,
    },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rider', riderSchema);
