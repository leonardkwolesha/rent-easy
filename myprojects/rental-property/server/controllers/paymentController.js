const Payment          = require('../models/Payment');
const Lease            = require('../models/Lease');
const PlatformSettings = require('../models/PlatformSettings');
const azampay          = require('../utils/azampay');

async function applyFee(payment) {
  const settings = await PlatformSettings.findOne().sort('-updatedAt');
  const rate = settings?.transactionFeeRate ?? 2.5;
  payment.platformFeeRate = rate;
  payment.platformFee     = Math.round(payment.amount * (rate / 100));
  payment.netToLandlord   = payment.amount - payment.platformFee;
}

const MOBILE_PROVIDERS = ['mpesa', 'airtel', 'mixx', 'halotel'];
const PROVIDER_LABELS  = { mpesa: 'M-Pesa', airtel: 'Airtel Money', mixx: 'Mixx by Yas', halotel: 'Halopesa', bank: 'Bank Transfer', cash: 'Cash' };

exports.getMyPayments = async (req, res, next) => {
  try {
    // Auto-mark pending payments whose due date has passed
    await Payment.updateMany(
      { tenant: req.user._id, status: 'pending', dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } }
    );
    const payments = await Payment.find({ tenant: req.user._id })
      .populate('property', 'title address')
      .sort('-dueDate');
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
};

exports.getLandlordPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ landlord: req.user._id })
      .populate('property', 'title address')
      .populate('tenant', 'name email phone')
      .sort('-dueDate');
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
};

exports.initiatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.tenant.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (payment.status === 'paid')
      return res.status(400).json({ success: false, message: 'Payment is already completed' });

    const { provider, phone } = req.body;
    if (!provider) return res.status(400).json({ success: false, message: 'Payment provider is required' });

    const isMobile = MOBILE_PROVIDERS.includes(provider);
    if (isMobile && !phone)
      return res.status(400).json({ success: false, message: 'Phone number is required for mobile money' });

    // Unique reference for this initiation
    const ref = `RP-${payment._id.toString().slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const amtStr = `TZS ${payment.amount.toLocaleString()}`;
    const providerLabel = PROVIDER_LABELS[provider] || provider;

    let useRealGateway = false;
    let gatewayTransactionId = null;

    if (isMobile && azampay.hasCredentials()) {
      try {
        const result = await azampay.mnoCheckout({
          phone,
          amount: payment.amount,
          currency: 'TZS',
          externalId: ref,
          provider,
        });
        gatewayTransactionId = result.transactionId || null;
        useRealGateway = true;
      } catch (azErr) {
        console.error('[AzamPay] checkout error:', azErr.message);
        // Fall through to simulation
      }
    }

    const instructions = useRealGateway
      ? `A payment request of ${amtStr} has been sent to your ${providerLabel} number ${phone}. Open the prompt on your phone and enter your PIN to confirm. Your payment will be verified automatically — no code needed here.`
      : buildSimInstructions(provider, amtStr, phone, ref);

    // Persist the gateway ref so the webhook can find this payment
    payment.gatewayRef = ref;
    if (gatewayTransactionId) payment.transactionId = gatewayTransactionId;
    await payment.save();

    res.json({
      success: true,
      data: {
        reference: ref,
        provider,
        providerLabel,
        phone:    phone || null,
        amount:   payment.amount,
        instructions,
        useRealGateway,
        gatewayTransactionId,
      },
    });
  } catch (err) { next(err); }
};

exports.getPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).select('tenant status paidDate paymentMethod');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.tenant.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, data: { status: payment.status, paidDate: payment.paidDate, paymentMethod: payment.paymentMethod } });
  } catch (err) { next(err); }
};

exports.azamPayWebhook = async (req, res, next) => {
  try {
    // AzamPay posts: utilityref (our externalId), tranid, operator, msisdn, amount, message
    const { utilityref, tranid, operator } = req.body;
    if (!utilityref) return res.status(400).json({ success: false, message: 'Missing reference' });

    const payment = await Payment.findOne({ gatewayRef: utilityref });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    if (payment.status !== 'paid') {
      const REVERSE = { Mpesa: 'mpesa', Airtel: 'airtel', Tigopesa: 'mixx', Halopesa: 'halotel' };
      payment.status        = 'paid';
      payment.paidDate      = new Date();
      payment.transactionId = tranid || payment.transactionId;
      payment.paymentMethod = REVERSE[operator] || payment.paymentMethod || 'mpesa';
      await applyFee(payment);
      await payment.save();
    }

    res.json({ success: true, message: 'Payment updated' });
  } catch (err) { next(err); }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.tenant.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (payment.status === 'paid')
      return res.status(400).json({ success: false, message: 'Payment is already completed' });
    if (!req.body.transactionId?.trim())
      return res.status(400).json({ success: false, message: 'A transaction reference or confirmation code is required to verify payment.' });
    payment.status        = 'paid';
    payment.paidDate      = new Date();
    payment.paymentMethod = req.body.paymentMethod;
    payment.transactionId = req.body.transactionId;
    payment.gatewayRef    = req.body.gatewayRef || payment.gatewayRef;
    await applyFee(payment);
    await payment.save();
    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
};

exports.ensureCurrentPayment = async (req, res, next) => {
  try {
    // Auto-expire past-endDate leases before looking up the active one
    const expired = await Lease.find({ tenant: req.user._id, status: 'active', endDate: { $lt: new Date() } }).select('_id');
    if (expired.length) {
      await Lease.updateMany({ _id: { $in: expired.map(l => l._id) } }, { $set: { status: 'expired' } });
    }

    const query = { tenant: req.user._id, status: 'active' };
    if (req.body.leaseId) query._id = req.body.leaseId;
    const lease = await Lease.findOne(query).populate('property', 'title');
    if (!lease)
      return res.status(404).json({ success: false, message: 'No active lease found. Your application must be approved first.' });

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dueDate = new Date(now.getFullYear(), now.getMonth(), lease.paymentDay || 1);

    const propId = lease.property?._id || lease.property;
    let payment = await Payment.findOne({ lease: lease._id, period });

    if (!payment) {
      // Detect a payment created for the wrong lease (same tenant + property + period).
      // This happens when ensure-current was previously called without a leaseId and
      // MongoDB returned a different active lease first.
      const mislinked = await Payment.findOne({ tenant: req.user._id, property: propId, period });
      if (mislinked && mislinked.lease.toString() !== lease._id.toString()) {
        mislinked.lease = lease._id;
        await mislinked.save();
        payment = mislinked;
      }
    }

    if (!payment) {
      payment = await Payment.create({
        lease: lease._id,
        tenant: lease.tenant,
        landlord: lease.landlord,
        property: lease.property,
        amount: lease.rentAmount,
        type: 'rent',
        dueDate,
        period,
        status: dueDate < now ? 'overdue' : 'pending',
      });
    }

    if (payment.status === 'paid') {
      return res.json({ success: true, data: payment, alreadyPaid: true });
    }

    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
};

exports.generateMonthlyPayments = async (req, res, next) => {
  try {
    const lease = await Lease.findById(req.body.leaseId);
    if (!lease) return res.status(404).json({ success: false, message: 'Lease not found' });
    if (lease.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const payments = [];
    const end = new Date(lease.endDate);
    let current = new Date(lease.startDate);

    while (current <= end) {
      const period  = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const dueDate = new Date(current.getFullYear(), current.getMonth(), lease.paymentDay);
      const exists  = await Payment.findOne({ lease: lease._id, period });
      if (!exists) {
        payments.push({
          lease: lease._id, tenant: lease.tenant, landlord: lease.landlord,
          property: lease.property, amount: lease.rentAmount,
          type: 'rent', dueDate, period,
        });
      }
      current.setMonth(current.getMonth() + 1);
    }

    const created = await Payment.insertMany(payments);
    res.json({ success: true, data: created, count: created.length });
  } catch (err) { next(err); }
};

function buildSimInstructions(provider, amtStr, phone, ref) {
  const map = {
    mpesa:  `Dial *150*00# or open the M-Pesa app. Select "Pay by M-Pesa", enter ${amtStr}, and use reference ${ref}. You can also wait for the payment prompt on ${phone}.`,
    airtel: `Dial *150*60# or open the Airtel Money app. Select "Make Payment", enter ${amtStr}, and use reference ${ref}. You can also wait for the prompt on ${phone}.`,
    mixx:   `Dial *150*00# or open the Mixx by Yas app. Select "Pay Bill", enter ${amtStr}, and use reference ${ref}. You can also wait for the prompt on ${phone}.`,
    halotel:`Dial *150*88# or open the Halopesa app. Select "Lipa", enter ${amtStr}, and use reference ${ref}. You can also wait for the prompt on ${phone}.`,
    bank:   `Transfer ${amtStr} to the landlord's bank account. Use reference ${ref} as the payment description. Enter the bank transaction ID below after transferring.`,
    cash:   `Pay ${amtStr} in cash to your landlord and obtain a receipt. Enter the receipt number below to record this payment.`,
  };
  return map[provider] || `Send ${amtStr} and use reference ${ref}.`;
}
