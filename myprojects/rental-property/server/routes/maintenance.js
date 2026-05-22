const router = require('express').Router();
const ctrl = require('../controllers/maintenanceController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.post('/', auth, requireRole('tenant'), ctrl.createRequest);
router.get('/my', auth, requireRole('tenant'), ctrl.getMyRequests);
router.get('/landlord', auth, requireRole('landlord', 'agent', 'admin'), ctrl.getLandlordRequests);
router.put('/:id', auth, ctrl.updateRequest);

module.exports = router;
