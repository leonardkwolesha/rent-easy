const Restaurant = require('../models/Restaurant');

exports.getRestaurants = async (req, res) => {
  const { cuisine, area, isOpen, sort, q } = req.query;

  const filter = {};
  if (cuisine) {
    const escaped = cuisine.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.cuisine = new RegExp(`^${escaped}$`, 'i');
  }
  if (area) filter['location.area'] = new RegExp(area, 'i');
  if (isOpen !== undefined) filter.isOpen = isOpen === 'true';
  if (q) {
    const re = new RegExp(q.trim(), 'i');
    filter.$or = [{ name: re }, { cuisine: re }, { description: re }];
  }

  const sortMap = {
    rating: { rating: -1 },
    delivery: { deliveryTime: 1 },
    fee: { deliveryFee: 1 },
  };

  const restaurants = await Restaurant.find(filter)
    .sort(sortMap[sort] || { rating: -1 })
    .select('-menu');

  res.json(restaurants);
};

exports.getRestaurantById = async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  res.json(restaurant);
};

exports.createRestaurant = async (req, res) => {
  const restaurant = await Restaurant.create(req.body);
  res.status(201).json(restaurant);
};

exports.updateRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  res.json(restaurant);
};
