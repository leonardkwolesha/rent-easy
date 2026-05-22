const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  processPayment, refund, getPaymentByOrder, webhook, topUpWallet,
} = require('../controllers/paymentController');

// Public — ClickPesa callback (must NOT require JWT auth).
router.post('/webhook', webhook);

router.use(protect);

router.post('/', processPayment);
router.post('/refund', refund);
router.post('/wallet/topup', topUpWallet);
router.get('/order/:orderId', getPaymentByOrder);

module.exports = router;
