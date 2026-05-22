const router = require('express').Router();
const ctrl = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.post('/property/:propertyId', auth, requireRole('tenant'), ctrl.apply);
router.get('/sent', auth, requireRole('tenant'), ctrl.getMyApplications);
router.get('/received', auth, requireRole('landlord', 'agent', 'admin'), ctrl.getReceivedApplications);
router.put('/:id/approve', auth, requireRole('landlord', 'agent', 'admin'), ctrl.approveApplication);
router.put('/:id/reject', auth, requireRole('landlord', 'agent', 'admin'), ctrl.rejectApplication);

module.exports = router;
