const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

exports.getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === 'true';
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { next(err); }
};

exports.approveUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isApproved: true },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'restaurant' && user.restaurantId) {
      await Restaurant.findByIdAndUpdate(user.restaurantId, { isApproved: true });
    }

    req.io.emit('user:approved', { userId: user._id.toString(), role: user.role });
    res.json(user);
  } catch (err) { next(err); }
};

exports.rejectUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isApproved: false },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.getRestaurants = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === 'true';
    const restaurants = await Restaurant.find(filter)
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (err) { next(err); }
};

exports.updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;

    const orders = await Order.find(filter)
      .populate('userId', 'name phone')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(orders);
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers, totalRiders, totalRestaurants,
      pendingApprovals, todayOrders, totalOrders,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'rider' }),
      User.countDocuments({ role: 'restaurant' }),
      User.countDocuments({ isApproved: false, role: { $ne: 'customer' } }),
      Order.find({ createdAt: { $gte: today } }),
      Order.countDocuments(),
    ]);

    const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);

    res.json({
      totalCustomers,
      totalRiders,
      totalRestaurants,
      pendingApprovals,
      todayOrders: todayOrders.length,
      todayRevenue,
      totalOrders,
    });
  } catch (err) { next(err); }
};
