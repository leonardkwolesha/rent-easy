const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/profile', auth, ctrl.getProfile);
router.put('/profile', auth, upload.single('avatar'), ctrl.updateProfile);

module.exports = router;
