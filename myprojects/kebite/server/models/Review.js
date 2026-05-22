const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
    ratings: {
      food: { type: Number, min: 1, max: 5 },
      packaging: { type: Number, min: 1, max: 5 },
      rider: { type: Number, min: 1, max: 5 },
      overall: { type: Number, min: 1, max: 5 },
    },
    comment: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
