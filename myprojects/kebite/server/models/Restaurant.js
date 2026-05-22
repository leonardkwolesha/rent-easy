const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cuisine: [String],
    location: {
      lat: Number,
      lng: Number,
      area: String,
      address: { type: String, default: '' },
    },
    rating: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    menu: [
      {
        name: String,
        description: String,
        price: Number,
        category: String,
        image: String,
        imageUrl: String,
        tags: [String],
        isAvailable: { type: Boolean, default: true },
      },
    ],
    deliveryFee: { type: Number, default: 0 },
    deliveryTime: { type: Number, default: 30 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isApproved: { type: Boolean, default: false },
    phone: { type: String, default: '' },
    openingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '22:00' },
    },
    promoLabel: { type: String, default: '' },
    minOrder: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
