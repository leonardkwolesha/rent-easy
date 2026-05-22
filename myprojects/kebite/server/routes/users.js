const router = require('express').Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile, updateProfile, updatePreferences,
  addAddress, deleteAddress,
  changePassword, uploadAvatar, removeAvatar,
} = require('../controllers/userController');

router.use(protect);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/me/preferences', updatePreferences);
router.post('/me/addresses', addAddress);
router.delete('/me/addresses/:addressId', deleteAddress);
router.post('/me/change-password', changePassword);
router.post('/me/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/me/avatar', removeAvatar);

module.exports = router;
