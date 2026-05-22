const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validatePromo } = require('../controllers/promotionsController');

// GET /api/promotions/validate?code=KEBITE20&orderTotal=15000
router.get('/validate', protect, validatePromo);

module.exports = router;
