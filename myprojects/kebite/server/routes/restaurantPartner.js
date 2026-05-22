const router = require('express').Router();
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const upload = require('../middleware/upload');
const {
  getMyRestaurant, updateMyRestaurant,
  addMenuItem, updateMenuItem, deleteMenuItem, uploadMenuItemImage,
  getMyOrders, getOrderById, updateOrderStatus, getAnalytics,
} = require('../controllers/restaurantPartnerController');

router.use(protect, requireRole('restaurant'));

router.get('/me', getMyRestaurant);
router.put('/me', updateMyRestaurant);
router.post('/me/menu/upload', upload.single('image'), uploadMenuItemImage);
router.post('/me/menu', addMenuItem);
router.put('/me/menu/:itemId', updateMenuItem);
router.delete('/me/menu/:itemId', deleteMenuItem);
router.get('/me/orders', getMyOrders);
router.get('/me/orders/:orderId', getOrderById);
router.put('/me/orders/:orderId', updateOrderStatus);
router.get('/me/analytics', getAnalytics);

module.exports = router;
