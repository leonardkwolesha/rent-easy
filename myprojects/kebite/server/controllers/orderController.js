const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

const DEFAULT_DELIVERY_FEE = 2000;

// Rename populated Mongoose fields to the names the customer frontend expects
function normalizeOrder(doc) {
  const obj = doc && doc.toObject ? doc.toObject() : { ...(doc || {}) };
  obj.restaurant = obj.restaurantId ?? null;
  obj.rider      = obj.riderId      ?? null;
  return obj;
}

exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, items, total, paymentMethod, deliveryAddress } = req.body;

    if (!restaurantId || !items?.length || !total || !paymentMethod || !deliveryAddress) {
      return res.status(400).json({ message: 'restaurantId, items, total, paymentMethod and deliveryAddress are required' });
    }

    const restaurant = await Restaurant.findById(restaurantId).select('deliveryFee');
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const deliveryFee = restaurant.deliveryFee && restaurant.deliveryFee > 0
      ? restaurant.deliveryFee
      : DEFAULT_DELIVERY_FEE;

    const order = await Order.create({
      userId: req.user._id,
      restaurantId,
      items,
      total,
      deliveryFee,
      paymentMethod,
      deliveryAddress,
      status: 'placed',
      timeline: [{ status: 'placed', time: new Date() }],
    });

    req.io.emit('order:statusUpdate', { orderId: order._id, status: 'placed' });
    res.status(201).json(order);
  } catch (err) {
    console.error('[createOrder]', err.message);
    res.status(500).json({ message: err.message || 'Could not create order.' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name location')
      .populate('riderId', 'name phone currentLocation');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(normalizeOrder(order));
  } catch (err) {
    console.error('[getOrderById]', err.message);
    res.status(500).json({ message: 'Could not load order.' });
  }
};

exports.getOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id).select('status timeline');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId && order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ status: order.status, timeline: order.timeline });
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('restaurantId', 'name')
      .populate('riderId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(orders.map(normalizeOrder));
  } catch (err) {
    console.error('[getMyOrders]', err.message);
    res.status(500).json({ message: 'Could not load orders.' });
  }
};

exports.listOrders = async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;
  if (status === 'ready') query.riderId = { $exists: false };

  const orders = await Order.find(query)
    .populate('restaurantId', 'name location')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(orders);
};

exports.cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (!['placed', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ message: 'Order cannot be cancelled once preparation has started' });
  }

  const reason = (req.body.reason || '').trim();
  order.status              = 'cancelled';
  order.cancellationReason  = reason;
  order.cancelledBy         = 'customer';
  order.timeline.push({ status: 'cancelled', time: new Date(), note: reason });
  await order.save();

  req.io.emit('order:statusUpdate', { orderId: order._id.toString(), status: 'cancelled' });
  res.json({ message: 'Order cancelled', order });
};
