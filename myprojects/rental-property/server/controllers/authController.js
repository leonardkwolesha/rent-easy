const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

exports.register = async (req, res, next) => {
  try {
    const { name, password, role, phone } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const allowedRoles = ['tenant', 'landlord', 'agent'];
    const user = await User.create({
      name, email, password, phone,
      role: allowedRoles.includes(role) ? role : 'tenant',
    });

    const token = signToken(user._id);
    const userData = user.toObject();
    delete userData.password;
    res.status(201).json({ success: true, token, user: userData });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      console.log(`[login] No user found for email: ${normalizedEmail}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      console.log(`[login] Wrong password for: ${normalizedEmail}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.role === 'agent' && !user.isApproved) {
      return res.status(403).json({ success: false, message: 'Your agent account is pending approval. Please contact an admin.' });
    }
    const token = signToken(user._id);
    const userData = user.toObject();
    delete userData.password;
    res.json({ success: true, token, user: userData });
  } catch (err) { next(err); }
};

exports.getMe = (req, res) => res.json({ success: true, user: req.user });

exports.resetPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (err) { next(err); }
};
