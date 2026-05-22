const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { createTicket, getMyTickets, getTicket } = require('../controllers/supportController');

router.use(protect);

// POST /api/support
router.post('/', createTicket);

// GET /api/support
router.get('/', getMyTickets);

// GET /api/support/:ticketId
router.get('/:ticketId', getTicket);

module.exports = router;
