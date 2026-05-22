const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issue: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'inProgress', 'resolved'],
      default: 'open',
    },
    ticketId: { type: String, unique: true },
    conversationHistory: [
      {
        role: { type: String, enum: ['user', 'assistant', 'agent'] },
        content: String,
        time: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

supportTicketSchema.pre('save', function (next) {
  if (!this.ticketId) {
    this.ticketId = 'KB' + Date.now().toString().slice(-6);
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
