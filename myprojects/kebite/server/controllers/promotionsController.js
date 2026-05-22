const Promo = require('../models/Promo');

exports.validatePromo = async (req, res) => {
  const { code, orderTotal } = req.query;
  if (!code) return res.status(400).json({ message: 'code is required' });

  const promo = await Promo.findOne({ code: code.toUpperCase() });
  if (!promo) return res.status(404).json({ message: 'Invalid promo code' });

  if (promo.expiry && promo.expiry < new Date()) {
    return res.status(400).json({ message: 'Promo code has expired' });
  }

  const alreadyUsed = promo.usedBy.some((id) => id.toString() === req.user._id.toString());
  if (alreadyUsed) {
    return res.status(400).json({ message: 'You have already used this promo code' });
  }

  if (orderTotal && Number(orderTotal) < promo.minOrder) {
    return res.status(400).json({
      message: `Minimum order of TSh ${promo.minOrder.toLocaleString()} required`,
      minOrder: promo.minOrder,
    });
  }

  const discountAmount =
    promo.discountType === 'percentage'
      ? Math.round((Number(orderTotal || 0) * promo.discount) / 100)
      : promo.discount;

  res.json({
    valid: true,
    code: promo.code,
    discountType: promo.discountType,
    discount: promo.discount,
    discountAmount,
    minOrder: promo.minOrder,
  });
};
