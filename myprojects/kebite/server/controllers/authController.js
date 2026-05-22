const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const formatUser = require('../utils/formatUser');

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const VALID_ROLES = ['customer', 'restaurant', 'rider'];

exports.register = async (req, res, next) => {
  try {
    const {
      name, email, phone, password,
      role = 'customer', restaurantName, restaurantAddress,
      licenseNumber, vehicleType,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'name, email, phone and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be customer, restaurant, or rider' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const userData = {
      name, email, phone, password, role,
      isApproved: role === 'customer',
    };

    if (role === 'rider') {
      if (licenseNumber) userData.licenseNumber = licenseNumber;
      if (vehicleType && ['bicycle', 'motorcycle', 'car'].includes(vehicleType)) {
        userData.vehicleType = vehicleType;
      }
    }

    const user = await User.create(userData);

    if (role === 'restaurant') {
      if (!restaurantAddress || !restaurantAddress.trim()) {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Street address is required for restaurant accounts' });
      }
      const restaurant = await Restaurant.create({
        name: restaurantName || `${name}'s Restaurant`,
        ownerId: user._id,
        isApproved: false,
        isOpen: false,
        location: { address: restaurantAddress.trim() },
        phone,
      });
      user.restaurantId = restaurant._id;
      await user.save();
    }

    const token = signToken(user._id);
    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isApproved && user.role !== 'customer' && user.role !== 'admin') {
      return res.status(403).json({
        message: 'Your account is pending approval. The Kebite team will review within 24 hours.',
      });
    }

    const token = signToken(user._id);
    res.json({ token, user: formatUser(user) });
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'email is required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'No account found' });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetToken = hashedToken;
  user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
  await user.save();

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Password reset token for ${email}: ${rawToken}`);
  }

  res.json({ message: 'Reset link sent' });
};

exports.googleLogin = async (req, res, next) => {
  try {
    if (!googleClient) {
      return res.status(503).json({ message: 'Google sign-in is not configured on the server (missing GOOGLE_CLIENT_ID).' });
    }
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'credential is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ message: 'Google account email not verified' });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

    if (!user) {
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        googleId: payload.sub,
        avatar: payload.picture || null,
        role: 'customer',
        isApproved: true,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      await user.save();
    }

    if (!user.isApproved && user.role !== 'customer' && user.role !== 'admin') {
      return res.status(403).json({
        message: 'Your account is pending approval. The Kebite team will review within 24 hours.',
      });
    }

    const token = signToken(user._id);
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    if (err.message?.includes('Token used too late') || err.message?.includes('audience')) {
      return res.status(401).json({ message: 'Invalid Google credential' });
    }
    next(err);
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'token and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: Date.now() },
  }).select('+resetToken +resetTokenExpiry');

  if (!user) return res.status(400).json({ message: 'Token invalid or expired' });

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.json({ message: 'Password updated' });
};
