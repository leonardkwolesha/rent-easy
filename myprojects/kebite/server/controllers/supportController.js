const SupportTicket = require('../models/SupportTicket');

exports.createTicket = async (req, res) => {
  const { orderId, issue, conversationHistory } = req.body;
  if (!issue) return res.status(400).json({ message: 'issue is required' });

  const ticket = await SupportTicket.create({
    orderId,
    userId: req.user._id,
    issue,
    conversationHistory: conversationHistory || [],
  });

  res.status(201).json({
    ticketId: ticket.ticketId,
    status: ticket.status,
    estimatedResponse: '24 hours',
  });
};

exports.getMyTickets = async (req, res) => {
  const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(tickets);
};

exports.getTicket = async (req, res) => {
  const ticket = await SupportTicket.findOne({ ticketId: req.params.ticketId });
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (ticket.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json(ticket);
};
