const router = require('express').Router();
const ctrl = require('../controllers/propertyController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const upload = require('../middleware/upload');

router.get('/', ctrl.getProperties);
router.get('/my', auth, requireRole('landlord', 'agent', 'admin'), ctrl.getMyProperties);
router.get('/:id', ctrl.getProperty);
router.post('/', auth, requireRole('landlord', 'agent', 'admin'), ctrl.createProperty);
router.put('/:id', auth, requireRole('landlord', 'agent', 'admin'), ctrl.updateProperty);
router.delete('/:id', auth, requireRole('landlord', 'agent', 'admin'), ctrl.deleteProperty);
router.post('/:id/images', auth, requireRole('landlord', 'agent', 'admin'), upload.array('images', 10), ctrl.uploadImages);

module.exports = router;
