const User       = require('../models/User');
const Order      = require('../models/Order');
const formatUser = require('../utils/formatUser');

exports.getMyProfile = async (req, res) => {
  res.json(formatUser(req.user));
};

exports.updateAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'isAvailable must be a boolean' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id, { isAvailable }, { new: true }
    );
    res.json({ isAvailable: user.isAvailable });
  } catch (err) { next(err); }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, orderId } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      'currentLocation.lat': lat,
      'currentLocation.lng': lng,
    });
    const payload = { riderId: req.user._id.toString(), lat, lng };
    if (orderId) {
      payload.orderId = orderId;
      req.io.to(`order:${orderId}`).emit('rider:locationUpdate', payload);
    } else {
      req.io.emit('rider:locationUpdate', payload);
    }
    res.json({ lat, lng });
  } catch (err) { next(err); }
};

exports.getActiveOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      riderId: req.user._id,
      status: 'on_the_way',
    })
      .populate('restaurantId', 'name location deliveryFee')
      .populate('userId', 'name phone');
    res.json({ order: order || null });
  } catch (err) { next(err); }
};

exports.getAvailableOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: 'ready' })
      .populate('restaurantId', 'name location deliveryFee')
      .populate('userId', 'name')
      .sort({ createdAt: 1 });
    res.json(orders);
  } catch (err) { next(err); }
};

exports.acceptOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, status: 'ready' });
    if (!order) return res.status(404).json({ message: 'Order not available' });

    order.riderId = req.user._id;
    order.status = 'on_the_way';
    order.timeline.push({ status: 'on_the_way', time: new Date() });
    await order.save();

    const statusPayload = {
      orderId: order._id.toString(),
      status: 'on_the_way',
      riderName: req.user.name,
      riderPhone: req.user.phone,
    };
    req.io.emit('order:statusUpdate', statusPayload);
    req.io.to(`order:${order._id}`).emit('order:statusUpdate', statusPayload);

    const populatedOrder = await Order.findById(order._id)
      .populate('restaurantId', 'name location')
      .populate('userId', 'name phone');
    res.json(populatedOrder);
  } catch (err) { next(err); }
};

exports.markDelivered = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      riderId: req.user._id,
      status: 'on_the_way',
    });
    if (!order) return res.status(404).json({ message: 'Order not found or already delivered' });

    order.status = 'delivered';
    order.timeline.push({ status: 'delivered', time: new Date() });
    await order.save();

    const deliveredPayload = { orderId: order._id.toString(), status: 'delivered' };
    req.io.emit('order:statusUpdate', deliveredPayload);
    req.io.to(`order:${order._id}`).emit('order:statusUpdate', deliveredPayload);
    res.json(order);
  } catch (err) { next(err); }
};

exports.getOrderHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({
      riderId: req.user._id,
      status: 'delivered',
    })
      .populate('restaurantId', 'name')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(orders);
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayDeliveries, weekDeliveries, total] = await Promise.all([
      Order.find({ riderId: req.user._id, status: 'delivered', createdAt: { $gte: today } }),
      Order.find({ riderId: req.user._id, status: 'delivered', createdAt: { $gte: weekAgo } }),
      Order.countDocuments({ riderId: req.user._id, status: 'delivered' }),
    ]);

    const todayEarnings = todayDeliveries.reduce((s, o) => s + (o.deliveryFee || 0), 0);
    const weekEarnings  = weekDeliveries.reduce((s, o) => s + (o.deliveryFee || 0), 0);

    res.json({
      todayDeliveries: todayDeliveries.length,
      todayEarnings,
      weekEarnings,
      avgRating: 4.8,
      totalDeliveries: total,
    });
  } catch (err) { next(err); }
};
