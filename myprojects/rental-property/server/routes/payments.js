const router      = require('express').Router();
const ctrl        = require('../controllers/paymentController');
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Webhook — no auth (called by AzamPay)
router.post('/webhook/azampay', ctrl.azamPayWebhook);

router.get('/my',             auth, requireRole('tenant'),                     ctrl.getMyPayments);
router.post('/ensure-current', auth, requireRole('tenant'),                     ctrl.ensureCurrentPayment);
router.get('/landlord', auth, requireRole('landlord', 'agent', 'admin'),    ctrl.getLandlordPayments);
router.post('/generate',auth, requireRole('landlord', 'agent', 'admin'),    ctrl.generateMonthlyPayments);

router.post('/:id/initiate', auth, requireRole('tenant'), ctrl.initiatePayment);
router.get( '/:id/status',   auth, requireRole('tenant'), ctrl.getPaymentStatus);
router.put( '/:id/pay',      auth, requireRole('tenant'), ctrl.recordPayment);

module.exports = router;
