const User             = require('../models/User');
const Property         = require('../models/Property');
const Lease            = require('../models/Lease');
const Payment          = require('../models/Payment');
const Application      = require('../models/Application');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const PlatformSettings = require('../models/PlatformSettings');

exports.setup = async (req, res, next) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Admin account already exists. Use the seed script to reset it.' });
    }
    const admin = await User.create({
      name: 'RentEase Admin',
      email: 'admin@rentease.co.tz',
      password: 'Admin1234',
      role: 'admin',
      isVerified: true,
      isApproved: true,
    });
    res.json({ success: true, message: 'Admin created', email: admin.email, password: 'Admin1234' });
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const [users, properties, activeLeases, revenue] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Lease.countDocuments({ status: 'active' }),
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    res.json({
      success: true,
      data: { users, properties, activeLeases, totalRevenue: revenue[0]?.total || 0 },
    });
  } catch (err) { next(err); }
};

exports.getOverview = async (req, res, next) => {
  try {
    const [
      totalUsers, tenants, landlords, agents, pendingAgents,
      totalProperties, availableProps, occupiedProps,
      totalLeases, activeLeases, expiredLeases, terminatedLeases,
      totalPayments, paidPayments, pendingPayments, overduePayments,
      revenueResult, platformSettings,
      pendingApplications, openMaintenance, urgentMaintenance,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'tenant' }),
      User.countDocuments({ role: 'landlord' }),
      User.countDocuments({ role: 'agent' }),
      User.countDocuments({ role: 'agent', isApproved: false }),
      Property.countDocuments(),
      Property.countDocuments({ status: 'available' }),
      Property.countDocuments({ status: 'occupied' }),
      Lease.countDocuments(),
      Lease.countDocuments({ status: 'active' }),
      Lease.countDocuments({ status: 'expired' }),
      Lease.countDocuments({ status: 'terminated' }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'paid' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'overdue' }),
      Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Application.countDocuments({ status: 'pending' }),
      MaintenanceRequest.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      MaintenanceRequest.countDocuments({ priority: 'urgent', status: { $in: ['open', 'in_progress'] } }),
      PlatformSettings.findOne().sort('-updatedAt'),
    ]);
    res.json({
      success: true,
      data: {
        users: { total: totalUsers, tenants, landlords, agents, pendingAgents },
        properties: { total: totalProperties, available: availableProps, occupied: occupiedProps },
        leases: { total: totalLeases, active: activeLeases, expired: expiredLeases, terminated: terminatedLeases },
        payments: { total: totalPayments, paid: paidPayments, pending: pendingPayments, overdue: overduePayments },
        revenue: {
          totalVolume:  revenueResult[0]?.total || 0,
          platformFees: revenueResult[0]?.fees  || 0,
          feeRate:      platformSettings?.transactionFeeRate ?? 2.5,
        },
        pendingApplications,
        openMaintenance,
        urgentMaintenance,
      },
    });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const [users, total] = await Promise.all([
      User.find(filter).skip((page - 1) * limit).limit(Number(limit)).sort('-createdAt'),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, total });
  } catch (err) { next(err); }
};

exports.approveAgent = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.toggleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isVerified = !user.isVerified;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.getPayments = async (req, res, next) => {
  try {
    const { status, method, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.paymentMethod = method;
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('tenant', 'name email')
        .populate('landlord', 'name email')
        .populate('property', 'title address')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);
    res.json({ success: true, data: payments, total });
  } catch (err) { next(err); }
};

exports.getProperties = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('landlord', 'name email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Property.countDocuments(filter),
    ]);
    res.json({ success: true, data: properties, total });
  } catch (err) { next(err); }
};

exports.toggleFeatured = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    property.featured = !property.featured;
    await property.save();
    res.json({ success: true, data: property });
  } catch (err) { next(err); }
};

exports.getLeases = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const [leases, total] = await Promise.all([
      Lease.find(filter)
        .populate('tenant', 'name email')
        .populate('landlord', 'name email')
        .populate('property', 'title address')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Lease.countDocuments(filter),
    ]);
    res.json({ success: true, data: leases, total });
  } catch (err) { next(err); }
};

exports.getApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('tenant', 'name email')
        .populate('property', 'title address rent')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Application.countDocuments(filter),
    ]);
    res.json({ success: true, data: applications, total });
  } catch (err) { next(err); }
};

exports.getPlatformSettings = async (req, res, next) => {
  try {
    let settings = await PlatformSettings.findOne().sort('-updatedAt').populate('updatedBy', 'name email');
    if (!settings) settings = await PlatformSettings.create({ transactionFeeRate: 2.5 });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.updatePlatformSettings = async (req, res, next) => {
  try {
    const rate = parseFloat(req.body.transactionFeeRate);
    if (isNaN(rate) || rate < 0 || rate > 20)
      return res.status(400).json({ success: false, message: 'Fee rate must be between 0% and 20%.' });
    let settings = await PlatformSettings.findOne().sort('-updatedAt');
    if (!settings) settings = new PlatformSettings();
    settings.transactionFeeRate = rate;
    settings.updatedBy = req.user._id;
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.getRevenue = async (req, res, next) => {
  try {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [allTime, thisMonthData, monthly, topLandlords, recent] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, totalFees: { $sum: '$platformFee' }, totalVolume: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', period: currentPeriod } },
        { $group: { _id: null, fees: { $sum: '$platformFee' }, volume: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid', paidDate: { $gte: twelveMonthsAgo } } },
        { $group: { _id: '$period', fees: { $sum: '$platformFee' }, volume: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: '$landlord', fees: { $sum: '$platformFee' }, volume: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { volume: -1 } },
        { $limit: 8 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'landlord' } },
        { $unwind: { path: '$landlord', preserveNullAndEmptyArrays: true } },
        { $project: { 'landlord.name': 1, 'landlord.email': 1, fees: 1, volume: 1, count: 1 } },
      ]),
      Payment.find({ status: 'paid' })
        .populate('tenant', 'name')
        .populate('landlord', 'name')
        .populate('property', 'title')
        .sort('-paidDate')
        .limit(15)
        .select('amount platformFee platformFeeRate paidDate paymentMethod period tenant landlord property'),
    ]);

    const settings = await PlatformSettings.findOne().sort('-updatedAt');

    res.json({
      success: true,
      data: {
        summary: {
          totalFees:   allTime[0]?.totalFees   || 0,
          totalVolume: allTime[0]?.totalVolume || 0,
          totalCount:  allTime[0]?.count       || 0,
          thisMonthFees:   thisMonthData[0]?.fees   || 0,
          thisMonthVolume: thisMonthData[0]?.volume || 0,
          thisMonthCount:  thisMonthData[0]?.count  || 0,
          feeRate: settings?.transactionFeeRate ?? 2.5,
        },
        monthly,
        topLandlords,
        recent,
      },
    });
  } catch (err) { next(err); }
};

exports.getMaintenance = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(filter)
        .populate('tenant', 'name email')
        .populate('landlord', 'name email')
        .populate('property', 'title address')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      MaintenanceRequest.countDocuments(filter),
    ]);
    res.json({ success: true, data: requests, total });
  } catch (err) { next(err); }
};
