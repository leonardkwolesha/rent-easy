const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  createOrder,
  getOrderById,
  getOrderStatus,
  getMyOrders,
  listOrders,
  cancelOrder,
} = require('../controllers/orderController');

router.use(protect);

// POST /api/orders
router.post('/', createOrder);

// GET /api/orders?status=ready
router.get('/', listOrders);

// GET /api/orders/my
router.get('/my', getMyOrders);

// GET /api/orders/:id
router.get('/:id', getOrderById);

// GET /api/orders/:id/status
router.get('/:id/status', getOrderStatus);

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', cancelOrder);

module.exports = router;
