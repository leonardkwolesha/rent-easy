const router = require('express').Router();
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  getMyProfile, updateAvailability, updateLocation,
  getAvailableOrders, getActiveOrder, acceptOrder, markDelivered,
  getOrderHistory, getAnalytics,
} = require('../controllers/riderController');

router.use(protect, requireRole('rider'));

router.get('/me', getMyProfile);
router.put('/me/availability', updateAvailability);
router.put('/me/location', updateLocation);
router.get('/orders/available', getAvailableOrders);
router.get('/orders/active', getActiveOrder);
router.put('/orders/:orderId/accept', acceptOrder);
router.put('/orders/:orderId/delivered', markDelivered);
router.get('/orders/history', getOrderHistory);
router.get('/analytics', getAnalytics);

module.exports = router;
