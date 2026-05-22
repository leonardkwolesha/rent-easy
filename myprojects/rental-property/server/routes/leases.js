const router = require('express').Router();
const ctrl = require('../controllers/leaseController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/my',     auth, requireRole('tenant'), ctrl.getMyLease);
router.get('/my/all', auth, requireRole('tenant'), ctrl.getMyLeases);
router.get('/landlord', auth, requireRole('landlord', 'agent', 'admin'), ctrl.getLandlordLeases);
router.get('/:id', auth, ctrl.getLease);
router.put('/:id/terminate', auth, ctrl.terminateLease);

module.exports = router;
