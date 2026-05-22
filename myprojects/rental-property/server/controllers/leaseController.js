const Lease    = require('../models/Lease');
const Property = require('../models/Property');

/* Mark any leases whose endDate has passed as expired and free their properties */
async function autoExpire(tenantId) {
  const expired = await Lease.find({ tenant: tenantId, status: 'active', endDate: { $lt: new Date() } }).select('_id property');
  if (expired.length) {
    await Lease.updateMany({ _id: { $in: expired.map(l => l._id) } }, { $set: { status: 'expired' } });
    await Property.updateMany({ _id: { $in: expired.map(l => l.property) } }, { $set: { status: 'available' } });
  }
}

exports.getMyLease = async (req, res, next) => {
  try {
    await autoExpire(req.user._id);
    const lease = await Lease.findOne({ tenant: req.user._id, status: 'active' })
      .populate('property',    'title address images type')
      .populate('landlord',    'name email phone avatar')
      .populate('application', 'createdAt moveInDate message employmentStatus');
    res.json({ success: true, data: lease });
  } catch (err) { next(err); }
};

exports.getLease = async (req, res, next) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate('property', 'title address images type rent')
      .populate('tenant',   'name email phone avatar')
      .populate('landlord', 'name email phone avatar');
    if (!lease) return res.status(404).json({ success: false, message: 'Lease not found' });

    const ids = [lease.tenant._id.toString(), lease.landlord._id.toString()];
    if (!ids.includes(req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: lease });
  } catch (err) { next(err); }
};

exports.getMyLeases = async (req, res, next) => {
  try {
    await autoExpire(req.user._id);
    const leases = await Lease.find({ tenant: req.user._id })
      .populate('property',    'title address images type')
      .populate('landlord',    'name email phone avatar')
      .populate('application', 'createdAt moveInDate message employmentStatus')
      .sort('-createdAt');
    res.json({ success: true, data: leases });
  } catch (err) { next(err); }
};

exports.getLandlordLeases = async (req, res, next) => {
  try {
    const leases = await Lease.find({ landlord: req.user._id })
      .populate('property', 'title address')
      .populate('tenant',   'name email phone avatar')
      .sort('-createdAt');
    res.json({ success: true, data: leases });
  } catch (err) { next(err); }
};

exports.terminateLease = async (req, res, next) => {
  try {
    const lease = await Lease.findById(req.params.id);
    if (!lease) return res.status(404).json({ success: false, message: 'Lease not found' });

    const ids = [lease.tenant.toString(), lease.landlord.toString()];
    if (!ids.includes(req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    lease.status            = 'terminated';
    lease.terminationReason = req.body.reason || '';
    lease.terminatedAt      = new Date();
    await lease.save();
    await Property.findByIdAndUpdate(lease.property, { status: 'available' });
    res.json({ success: true, data: lease });
  } catch (err) { next(err); }
};
