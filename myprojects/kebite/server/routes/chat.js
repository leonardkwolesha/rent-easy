const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { chat, getHistory, clearHistory } = require('../controllers/chatController');

router.use(protect);

// POST /api/chat
// Body: { message: string, conversationHistory?: [{role, content}] }
router.post('/', chat);

// GET /api/chat/history
router.get('/history', getHistory);

// DELETE /api/chat/history
router.delete('/history', clearHistory);

module.exports = router;
