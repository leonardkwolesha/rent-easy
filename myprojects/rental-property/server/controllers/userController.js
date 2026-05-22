const User = require('../models/User');

exports.getProfile = (req, res) => res.json({ success: true, data: req.user });

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, agencyName, licenseNumber } = req.body;
    const updates = { name, phone };
    if (req.user.role === 'agent') Object.assign(updates, { agencyName, licenseNumber });
    if (req.file) updates.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};
