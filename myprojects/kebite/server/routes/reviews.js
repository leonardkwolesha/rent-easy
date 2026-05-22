const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { createReview } = require('../controllers/reviewController');

// POST /api/reviews
router.post('/', protect, createReview);

module.exports = router;
