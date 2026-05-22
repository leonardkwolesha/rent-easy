const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

exports.createReview = async (req, res) => {
  const { orderId, restaurantId, riderId, ratings, comment } = req.body;

  if (!orderId || !restaurantId || !ratings?.overall) {
    return res.status(400).json({ message: 'orderId, restaurantId and ratings.overall are required' });
  }

  const review = await Review.create({
    orderId,
    restaurantId,
    riderId,
    ratings,
    comment,
    userId: req.user._id,
  });

  // Recalculate restaurant average rating
  const allReviews = await Review.find({ restaurantId });
  const avg =
    allReviews.reduce((sum, r) => sum + (r.ratings?.overall || 0), 0) / allReviews.length;

  await Restaurant.findByIdAndUpdate(restaurantId, {
    rating: Math.round(avg * 10) / 10,
  });

  res.status(201).json(review);
};
