const MaintenanceRequest = require('../models/MaintenanceRequest');
const Lease = require('../models/Lease');

exports.createRequest = async (req, res, next) => {
  try {
    const lease = await Lease.findOne({ tenant: req.user._id, status: 'active' });
    if (!lease) return res.status(400).json({ success: false, message: 'No active lease found' });

    const request = await MaintenanceRequest.create({
      ...req.body,
      property: lease.property,
      lease: lease._id,
      tenant: req.user._id,
      landlord: lease.landlord,
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await MaintenanceRequest.find({ tenant: req.user._id })
      .populate('property', 'title address')
      .sort('-createdAt');
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

exports.getLandlordRequests = async (req, res, next) => {
  try {
    const filter = { landlord: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const requests = await MaintenanceRequest.find(filter)
      .populate('property', 'title address')
      .populate('tenant', 'name email phone avatar')
      .sort('-createdAt');
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

exports.updateRequest = async (req, res, next) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const ids = [request.landlord.toString(), request.tenant.toString()];
    if (!ids.includes(req.user._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status, landlordNote } = req.body;
    if (status) {
      request.status = status;
      if (status === 'resolved') request.resolvedAt = new Date();
      if (status === 'closed') request.closedAt = new Date();
    }
    if (landlordNote !== undefined) request.landlordNote = landlordNote;
    await request.save();
    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};
