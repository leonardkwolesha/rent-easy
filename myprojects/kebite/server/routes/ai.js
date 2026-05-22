const router = require('express').Router();
const { chat } = require('../controllers/aiController');

// POST /api/ai/chat — no auth required, chat widget is public
router.post('/chat', chat);

module.exports = router;
