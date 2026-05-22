const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const guard = [auth, requireRole('admin')];

router.post('/setup', ctrl.setup);   // unprotected — only works when no admin exists

router.get('/stats', ...guard, ctrl.getStats);
router.get('/overview', ...guard, ctrl.getOverview);
router.get('/users', ...guard, ctrl.getUsers);
router.put('/users/:id/approve', ...guard, ctrl.approveAgent);
router.put('/users/:id/toggle', ...guard, ctrl.toggleUser);
router.get('/payments', ...guard, ctrl.getPayments);
router.get('/properties', ...guard, ctrl.getProperties);
router.put('/properties/:id/featured', ...guard, ctrl.toggleFeatured);
router.get('/leases', ...guard, ctrl.getLeases);
router.get('/applications', ...guard, ctrl.getApplications);
router.get('/maintenance', ...guard, ctrl.getMaintenance);

router.get('/revenue',            ...guard, ctrl.getRevenue);
router.get('/platform-settings',  ...guard, ctrl.getPlatformSettings);
router.put('/platform-settings',  ...guard, ctrl.updatePlatformSettings);

module.exports = router;
