const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const Conversation = require('../models/Conversation');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Load once at startup — avoids repeated disk reads on every request
const MASTER_PROMPT = fs.readFileSync(
  path.join(__dirname, '../../ai/master-prompt.md'),
  'utf-8'
);

exports.chat = async (req, res) => {
  const { message, conversationHistory } = req.body;
  const userId = req.user._id;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ message: 'message is required' });
  }

  // Build the messages array for this API call.
  // Prefer the client-supplied conversationHistory when provided (lets the
  // frontend stay in sync without an extra round-trip).  Fall back to the
  // persisted conversation in MongoDB.
  let priorMessages = [];

  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    priorMessages = conversationHistory.map(({ role, content }) => ({ role, content }));
  } else {
    const saved = await Conversation.findOne({ userId }).lean();
    if (saved) {
      priorMessages = saved.messages.map(({ role, content }) => ({ role, content }));
    }
  }

  const messagesForApi = [...priorMessages, { role: 'user', content: message.trim() }];

  // Call Anthropic
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: MASTER_PROMPT,
    messages: messagesForApi,
  });

  const reply = response.content[0].text;

  // Persist the updated conversation to MongoDB (upsert — one doc per user)
  await Conversation.findOneAndUpdate(
    { userId },
    {
      $push: {
        messages: {
          $each: [
            { role: 'user', content: message.trim(), timestamp: new Date() },
            { role: 'assistant', content: reply, timestamp: new Date() },
          ],
        },
      },
    },
    { upsert: true, new: true }
  );

  res.json({
    reply,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  });
};

// Return the stored conversation for the authenticated user
exports.getHistory = async (req, res) => {
  const conversation = await Conversation.findOne({ userId: req.user._id }).lean();
  res.json(conversation ? conversation.messages : []);
};

// Wipe the stored conversation so the user can start fresh
exports.clearHistory = async (req, res) => {
  await Conversation.findOneAndDelete({ userId: req.user._id });
  res.json({ message: 'Conversation cleared' });
};
