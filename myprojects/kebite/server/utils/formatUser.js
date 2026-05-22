// Single source of truth for the user shape returned by every API endpoint.
// Both auth routes and profile routes must use this so web and mobile always
// receive the same object regardless of how the user was fetched.
module.exports = function formatUser(user) {
  return {
    id:               user._id,
    _id:              user._id,           // keep both so existing code using either works
    name:             user.name             || '',
    email:            user.email            || '',
    phone:            user.phone            || '',
    role:             user.role,
    isApproved:       user.isApproved       ?? true,
    restaurantId:     user.restaurantId     || null,
    avatar:           user.avatar           || null,
    createdAt:        user.createdAt,
    notificationPrefs: user.notificationPrefs || { sms: true, email: true, whatsapp: false },
    language:         user.language         || 'en',
    walletBalance:    user.walletBalance     ?? 0,
    orderCount:       user.orderCount       ?? 0,
    addresses:        user.addresses        || [],
    // Rider-specific (null for non-riders)
    isAvailable:      user.isAvailable      ?? false,
    vehicleType:      user.vehicleType      || null,
    licenseNumber:    user.licenseNumber    || null,
  };
};
