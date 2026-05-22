const Restaurant = require('../models/Restaurant');
const Order      = require('../models/Order');
const cloudinary = require('../config/cloudinary');

exports.getMyRestaurant = async (req, res, next) => {
  try {
    if (!req.user.restaurantId) {
      return res.status(404).json({ message: 'No restaurant linked to this account' });
    }
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) { next(err); }
};

exports.updateMyRestaurant = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'cuisine', 'phone', 'deliveryFee',
      'deliveryTime', 'minOrder', 'isOpen', 'imageUrl', 'promoLabel', 'openingHours'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (req.body.address) updates['location.address'] = req.body.address;

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user.restaurantId, { $set: updates }, { new: true, runValidators: true }
    );
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) { next(err); }
};

exports.addMenuItem = async (req, res, next) => {
  try {
    const { name, description, price, category, imageUrl, tags, isAvailable } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    if (!price || price <= 0) return res.status(400).json({ message: 'price must be greater than 0' });

    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    restaurant.menu.push({
      name, description, price,
      category: category || 'Main',
      imageUrl: imageUrl || '',
      tags: tags || [],
      isAvailable: isAvailable !== false,
    });
    await restaurant.save();
    res.status(201).json(restaurant.menu[restaurant.menu.length - 1]);
  } catch (err) { next(err); }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const item = restaurant.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    const allowed = ['name', 'description', 'price', 'category', 'imageUrl', 'tags', 'isAvailable'];
    allowed.forEach((k) => { if (req.body[k] !== undefined) item[k] = req.body[k]; });
    await restaurant.save();
    res.json(item);
  } catch (err) { next(err); }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const item = restaurant.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    item.isAvailable = false;
    await restaurant.save();
    res.json({ message: 'Item hidden from menu' });
  } catch (err) { next(err); }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      restaurantId: req.user.restaurantId,
    }).populate('userId', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const filter = { restaurantId: req.user.restaurantId };
    if (req.query.status) {
      if (req.query.status === 'pending') {
        filter.status = { $in: ['placed', 'confirmed', 'preparing', 'ready'] };
      } else {
        filter.status = req.query.status;
      }
    }
    const orders = await Order.find(filter)
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(orders);
  } catch (err) { next(err); }
};

const RESTAURANT_ALLOWED_STATUSES = ['confirmed', 'preparing', 'ready', 'cancelled'];

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!RESTAURANT_ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Restaurant can only set: ${RESTAURANT_ALLOWED_STATUSES.join(', ')}` });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      restaurantId: req.user.restaurantId,
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status === 'cancelled') {
      if (!['placed', 'confirmed', 'preparing'].includes(order.status)) {
        return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
      }
      order.cancellationReason = (reason || '').trim();
      order.cancelledBy        = 'restaurant';
    }

    order.status = status;
    order.timeline.push({ status, time: new Date(), note: (reason || '').trim() });
    await order.save();

    const statusPayload = { orderId: order._id.toString(), status };
    req.io.emit('order:statusUpdate', statusPayload);
    req.io.to(`order:${order._id}`).emit('order:statusUpdate', statusPayload);

    // When food is ready, broadcast to all riders so they see it immediately
    if (status === 'ready') {
      const populated = await Order.findById(order._id)
        .populate('restaurantId', 'name location')
        .populate('userId', 'name');
      req.io.to('role:rider').emit('order:available', {
        orderId:           order._id.toString(),
        restaurantName:    populated.restaurantId?.name || '',
        restaurantAddress: populated.restaurantId?.location?.address || '',
        customerAddress:   typeof order.deliveryAddress === 'string'
                             ? order.deliveryAddress
                             : [order.deliveryAddress?.street, order.deliveryAddress?.area, order.deliveryAddress?.city]
                                 .filter(Boolean).join(', '),
        items:             order.items,
        totalAmount:       order.total,
        deliveryFee:       order.deliveryFee,
      });
    }

    res.json(order);
  } catch (err) { next(err); }
};

exports.uploadMenuItemImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder:         'kebite/menu',
          public_id:      `menu_${req.user.restaurantId}_${Date.now()}`,
          transformation: [{ width: 600, height: 450, crop: 'fill' }],
        },
        (error, res) => (error ? reject(error) : resolve(res))
      ).end(req.file.buffer);
    });

    res.json({ imageUrl: result.secure_url });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayOrders, weekOrders, restaurant] = await Promise.all([
      Order.find({ restaurantId: req.user.restaurantId, createdAt: { $gte: today } }),
      Order.find({ restaurantId: req.user.restaurantId, createdAt: { $gte: weekAgo } }),
      Restaurant.findById(req.user.restaurantId),
    ]);

    const todayRevenue = todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + (o.total || 0), 0);
    const weekRevenue = weekOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + (o.total || 0), 0);

    const itemCounts = {};
    weekOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemCounts[item.name]) itemCounts[item.name] = { count: 0, revenue: 0 };
        const qty = item.quantity || 1;
        itemCounts[item.name].count += qty;
        itemCounts[item.name].revenue += (item.price || 0) * qty;
      });
    });

    const popularItems = Object.entries(itemCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, orders: data.count, revenue: data.revenue }));

    res.json({
      todayOrders: todayOrders.length,
      todayRevenue,
      weekRevenue,
      popularItems,
      avgRating: restaurant?.rating || 0,
    });
  } catch (err) { next(err); }
};
