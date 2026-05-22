const User       = require('../models/User');
const cloudinary = require('../config/cloudinary');
const formatUser = require('../utils/formatUser');

exports.getProfile = async (req, res) => {
  res.json(formatUser(req.user));
};

exports.updateProfile = async (req, res) => {
  const allowed = ['name', 'phone', 'notifications', 'language'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json(formatUser(user));
};

exports.updatePreferences = async (req, res) => {
  const { sms, email, whatsapp } = req.body || {};
  const updates = {};
  if (typeof sms      === 'boolean') updates['notificationPrefs.sms']      = sms;
  if (typeof email    === 'boolean') updates['notificationPrefs.email']    = email;
  if (typeof whatsapp === 'boolean') updates['notificationPrefs.whatsapp'] = whatsapp;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Provide at least one of sms, email, whatsapp (boolean)' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  res.json({ notificationPrefs: user.notificationPrefs });
};

exports.addAddress = async (req, res) => {
  const { label, street, area, city } = req.body;
  if (!street || !area) {
    return res.status(400).json({ message: 'street and area are required' });
  }

  req.user.addresses.push({ label, street, area, city });
  await req.user.save();
  res.status(201).json(req.user.addresses);
};

exports.deleteAddress = async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ message: 'Address not found' });

  address.deleteOne();
  await req.user.save();
  res.json(req.user.addresses);
};

exports.removeAvatar = async (req, res, next) => {
  try {
    await cloudinary.uploader.destroy(`kebite/avatars/user_${req.user._id}`);
    const user = await User.findByIdAndUpdate(req.user._id, { avatar: null }, { new: true });
    res.json({ avatar: user.avatar });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
};

exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file provided' });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'kebite/avatars',
          public_id: `user_${req.user._id}`,
          overwrite: true,
          transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
        },
        (error, res) => (error ? reject(error) : resolve(res))
      ).end(req.file.buffer);
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    );
    res.json({ avatar: user.avatar });
  } catch (err) { next(err); }
};
