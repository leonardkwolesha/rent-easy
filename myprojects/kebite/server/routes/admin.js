const router = require('express').Router();
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  getUsers, approveUser, rejectUser,
  getRestaurants, updateRestaurant,
  getOrders, getAnalytics,
} = require('../controllers/adminController');

router.use(protect, requireRole('admin'));

router.get('/users', getUsers);
router.put('/users/:userId/approve', approveUser);
router.put('/users/:userId/reject', rejectUser);
router.get('/restaurants', getRestaurants);
router.put('/restaurants/:id', updateRestaurant);
router.get('/orders', getOrders);
router.get('/analytics', getAnalytics);

module.exports = router;
