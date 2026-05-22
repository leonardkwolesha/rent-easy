module.exports = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  if (req.user.role === 'agent' && !req.user.isApproved) {
    return res.status(403).json({ success: false, message: 'Your agent account is pending approval by an admin' });
  }
  next();
};
