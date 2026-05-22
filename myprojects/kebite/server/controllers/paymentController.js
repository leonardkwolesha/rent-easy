const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const clickpesa = require('../services/clickpesa');

const MOBILE_METHODS = ['mpesa', 'airtel', 'tigo', 'mixx', 'halotel'];

function buildOrderReference(orderId) {
  return `KBT${String(orderId).slice(-12).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
}

exports.processPayment = async (req, res) => {
  const { orderId, method, phoneNumber } = req.body;
  if (!orderId || !method) {
    return res.status(400).json({ message: 'orderId and method are required' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (method === 'wallet') {
    const user = await User.findById(req.user._id);
    if (user.walletBalance < order.total) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
    user.walletBalance -= order.total;
    await user.save();

    const payment = await Payment.create({
      orderId, userId: req.user._id, amount: order.total, method, status: 'success',
    });

    order.status = 'confirmed';
    order.timeline.push({ status: 'confirmed', time: new Date() });
    await order.save();

    req.io.emit('order:statusUpdate', { orderId: order._id, status: 'confirmed' });
    return res.status(201).json({ payment, walletBalance: user.walletBalance });
  }

  if (method === 'cash') {
    const payment = await Payment.create({
      orderId, userId: req.user._id, amount: order.total, method, status: 'pending',
      reference: `COD-${orderId}`,
    });
    return res.status(201).json({ payment, message: 'Cash on delivery — pay your rider on arrival' });
  }

  if (MOBILE_METHODS.includes(method)) {
    if (!phoneNumber) {
      return res.status(400).json({ message: 'phoneNumber is required for mobile money payments' });
    }

    const reference = buildOrderReference(orderId);
    const payment = await Payment.create({
      orderId, userId: req.user._id, amount: order.total, method,
      status: 'pending', reference,
    });

    try {
      const cp = await clickpesa.initiateUssdPush({
        amount: order.total,
        orderReference: reference,
        phoneNumber,
      });
      return res.status(201).json({
        payment,
        gateway: { id: cp.id, status: cp.status, channel: cp.channel },
        message: 'Check your phone for the payment prompt',
      });
    } catch (err) {
      payment.status = 'failed';
      await payment.save();
      return res.status(502).json({
        message: err.message || 'Failed to initiate mobile money payment',
        details: err.body || null,
      });
    }
  }

  // card / other — gateway stub for now
  const payment = await Payment.create({
    orderId, userId: req.user._id, amount: order.total, method,
    status: 'pending', reference: `REF-${Date.now()}`,
  });
  return res.status(201).json({ payment, message: 'Payment initiated — awaiting gateway confirmation' });
};

exports.refund = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ message: 'orderId is required' });

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const payment = await Payment.findOne({ orderId, status: 'success' });
  if (!payment) return res.status(404).json({ message: 'No successful payment found for this order' });

  const user = await User.findById(req.user._id);
  user.walletBalance += payment.amount;
  await user.save();

  payment.status = 'failed';
  await payment.save();

  order.status = 'cancelled';
  order.timeline.push({ status: 'cancelled', time: new Date() });
  await order.save();

  res.json({ message: 'Refund credited to wallet', walletBalance: user.walletBalance });
};

exports.topUpWallet = async (req, res) => {
  const { phone, amount } = req.body;
  const numericAmount = Number(amount);
  if (!phone || !numericAmount || numericAmount <= 0) {
    return res.status(400).json({ message: 'phone and a positive amount are required' });
  }
  if (numericAmount < 500) {
    return res.status(400).json({ message: 'Minimum top-up is TSh 500' });
  }

  const reference = `TOPUP${String(req.user._id).slice(-8).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

  // Dev bypass — credit instantly so the UI flow can be tested without ClickPesa.
  if (process.env.CLICKPESA_DEV_BYPASS === 'true') {
    const payment = await Payment.create({
      userId: req.user._id, amount: numericAmount, method: 'mpesa',
      kind: 'wallet-topup', status: 'success', reference,
    });
    const user = await User.findById(req.user._id);
    user.walletBalance = (user.walletBalance || 0) + numericAmount;
    await user.save();
    req.io.emit('wallet:credited', { userId: user._id.toString(), balance: user.walletBalance });
    return res.status(201).json({
      payment, walletBalance: user.walletBalance,
      message: '[DEV] Wallet credited — bypassing ClickPesa',
    });
  }

  const payment = await Payment.create({
    userId: req.user._id,
    amount: numericAmount,
    method: 'mpesa',
    kind: 'wallet-topup',
    status: 'pending',
    reference,
  });

  try {
    const cp = await clickpesa.initiateUssdPush({
      amount: numericAmount,
      orderReference: reference,
      phoneNumber: phone,
    });
    return res.status(201).json({
      payment,
      gateway: { id: cp.id, status: cp.status, channel: cp.channel },
      message: 'Check your phone for the payment prompt',
    });
  } catch (err) {
    payment.status = 'failed';
    await payment.save();
    const detail = err.body?.message || err.body?.error || err.message || 'Unknown gateway error';
    return res.status(502).json({
      message: `Mobile money gateway rejected the request: ${detail}`,
      details: err.body || null,
      hint: 'Check server logs for [clickpesa] entries. Common causes: account not yet enabled for collections, phone format, IP not whitelisted, or merchant credentials inactive.',
    });
  }
};

exports.getPaymentByOrder = async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const payment = await Payment.findOne({ orderId: req.params.orderId }).sort({ createdAt: -1 });
  if (!payment) return res.status(404).json({ message: 'No payment for this order' });
  res.json(payment);
};

// ── Webhook ────────────────────────────────────────────────────────────────
// ClickPesa POSTs payment events here. Public route — no auth, no JWT.
exports.webhook = async (req, res) => {
  const evt = req.body || {};
  const reference = evt.orderReference || evt.reference;
  const eventType = evt.event || evt.eventType || evt.status;

  if (!reference) return res.status(400).json({ message: 'orderReference missing' });

  const payment = await Payment.findOne({ reference });
  if (!payment) {
    // Still 200 so ClickPesa doesn't retry forever for unknown refs.
    return res.status(200).json({ received: true, note: 'unknown reference' });
  }

  const isSuccess = /SUCCESS|RECEIVED|SETTLED/i.test(eventType);
  const isFailed = /FAIL/i.test(eventType);

  if (isSuccess && payment.status !== 'success') {
    payment.status = 'success';
    await payment.save();

    if (payment.kind === 'wallet-topup') {
      const user = await User.findById(payment.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + payment.amount;
        await user.save();
        req.io.emit('wallet:credited', { userId: user._id.toString(), balance: user.walletBalance });
      }
    } else if (payment.orderId) {
      const order = await Order.findById(payment.orderId);
      if (order && order.status === 'placed') {
        order.status = 'confirmed';
        order.timeline.push({ status: 'confirmed', time: new Date() });
        await order.save();
        req.io.emit('order:statusUpdate', { orderId: order._id.toString(), status: 'confirmed' });
      }
    }
  } else if (isFailed && payment.status !== 'failed') {
    payment.status = 'failed';
    await payment.save();
    req.io.emit('payment:failed', { orderId: payment.orderId.toString(), reason: evt.message });
  }

  res.status(200).json({ received: true });
};
