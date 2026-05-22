const Application = require('../models/Application');
const Property    = require('../models/Property');
const Lease       = require('../models/Lease');
const Payment     = require('../models/Payment');

exports.apply = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (property.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Property is not available' });
    }
    const existing = await Application.findOne({ property: property._id, tenant: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already applied to this property' });

    const application = await Application.create({ property: property._id, tenant: req.user._id, ...req.body });
    res.status(201).json({ success: true, data: application });
  } catch (err) { next(err); }
};

exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ tenant: req.user._id })
      .populate('property', 'title address images rent status bedrooms bathrooms type area_sqm deposit')
      .sort('-createdAt');
    res.json({ success: true, data: applications });
  } catch (err) { next(err); }
};

exports.getReceivedApplications = async (req, res, next) => {
  try {
    const myProperties = await Property.find({ landlord: req.user._id }).select('_id');
    const ids = myProperties.map(p => p._id);
    const applications = await Application.find({ property: { $in: ids } })
      .populate('property', 'title address images')
      .populate('tenant', 'name email phone avatar')
      .sort('-createdAt');
    res.json({ success: true, data: applications });
  } catch (err) { next(err); }
};

exports.approveApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('property');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    if (application.property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (application.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Application is already approved' });
    }

    // Prevent a tenant from holding two active leases simultaneously
    const activeLeaseExists = await Lease.findOne({ tenant: application.tenant, status: 'active' });
    if (activeLeaseExists) {
      return res.status(400).json({
        success: false,
        message: 'This tenant already has an active lease. It must be terminated before approving a new one.',
      });
    }

    application.status    = 'approved';
    application.reviewedAt = new Date();
    await application.save();

    const { startDate, endDate, paymentDay } = req.body;
    const leaseStart = startDate ? new Date(startDate) : new Date();
    const leaseEnd   = endDate   ? new Date(endDate)   : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const pDay       = Math.min(Math.max(parseInt(paymentDay) || 1, 1), 28);

    const lease = await Lease.create({
      property:      application.property._id,
      tenant:        application.tenant,
      landlord:      req.user._id,
      application:   application._id,
      startDate:     leaseStart,
      endDate:       leaseEnd,
      rentAmount:    application.property.rent.amount,
      depositAmount: application.property.deposit || 0,
      paymentDay:    pDay,
    });

    await Property.findByIdAndUpdate(application.property._id, { status: 'occupied' });
    await Application.updateMany(
      { property: application.property._id, _id: { $ne: application._id }, status: 'pending' },
      { status: 'rejected', rejectionReason: 'Property no longer available', reviewedAt: new Date() }
    );

    // Auto-generate monthly payment records for the full lease term
    const now = new Date();
    const payments = [];
    let cursor = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1);
    const lastMonth = new Date(leaseEnd.getFullYear(), leaseEnd.getMonth(), 1);
    while (cursor <= lastMonth) {
      const period  = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const dueDate = new Date(cursor.getFullYear(), cursor.getMonth(), pDay);
      payments.push({
        lease:     lease._id,
        tenant:    lease.tenant,
        landlord:  lease.landlord,
        property:  lease.property,
        amount:    lease.rentAmount,
        type:      'rent',
        dueDate,
        period,
        status:    dueDate < now ? 'overdue' : 'pending',
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    if (payments.length > 0) await Payment.insertMany(payments);

    res.json({ success: true, data: { application, lease } });
  } catch (err) { next(err); }
};

exports.rejectApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('property');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    if (application.property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    application.status = 'rejected';
    application.rejectionReason = req.body.reason || '';
    application.reviewedAt = new Date();
    await application.save();
    res.json({ success: true, data: application });
  } catch (err) { next(err); }
};
