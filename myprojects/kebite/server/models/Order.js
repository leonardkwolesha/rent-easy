const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [
      {
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
      },
    ],
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled'],
      default: 'placed',
    },
    total: Number,
    deliveryFee: Number,
    paymentMethod: {
      type: String,
      enum: ['mpesa', 'airtel', 'tigo', 'mixx', 'cash', 'wallet', 'card'],
    },
    deliveryAddress: {
      label: String,
      street: String,
      area: String,
      city: String,
    },
    cancellationReason: { type: String, default: '' },
    cancelledBy:        { type: String, enum: ['customer', 'restaurant', ''], default: '' },
    timeline: [
      {
        status: String,
        time:   { type: Date, default: Date.now },
        note:   { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
