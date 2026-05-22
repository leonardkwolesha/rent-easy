const Property = require('../models/Property');

exports.getProperties = async (req, res, next) => {
  try {
    const { city, type, minRent, maxRent, bedrooms, status = 'available', page = 1, limit = 12 } = req.query;
    const filter = { status };
    if (city) filter['address.city'] = new RegExp(city, 'i');
    if (type) filter.type = type;
    if (bedrooms) filter.bedrooms = Number(bedrooms);
    if (minRent || maxRent) {
      filter['rent.amount'] = {};
      if (minRent) filter['rent.amount'].$gte = Number(minRent);
      if (maxRent) filter['rent.amount'].$lte = Number(maxRent);
    }

    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('landlord', 'name avatar phone')
        .skip(skip).limit(Number(limit)).sort('-createdAt'),
      Property.countDocuments(filter),
    ]);

    res.json({ success: true, data: properties, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

exports.getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name avatar phone email');
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, data: property });
  } catch (err) { next(err); }
};

exports.createProperty = async (req, res, next) => {
  try {
    const property = await Property.create({ ...req.body, landlord: req.user._id });
    res.status(201).json({ success: true, data: property });
  } catch (err) { next(err); }
};

exports.updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (property.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    Object.assign(property, req.body);
    await property.save();
    res.json({ success: true, data: property });
  } catch (err) { next(err); }
};

exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (property.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await property.deleteOne();
    res.json({ success: true, message: 'Property deleted' });
  } catch (err) { next(err); }
};

exports.getMyProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ landlord: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: properties });
  } catch (err) { next(err); }
};

exports.uploadImages = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    if (property.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    property.images.push(...req.files.map(f => f.path));
    await property.save();
    res.json({ success: true, data: property });
  } catch (err) { next(err); }
};
