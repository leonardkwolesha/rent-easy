const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getSystemPrompt() {
  try {
    return fs.readFileSync(
      path.join(__dirname, '../../client/src/ai/assistant-prompt.md'),
      'utf-8'
    );
  } catch {
    return `You are Kebite Assistant, a helpful support agent for Kebite — Tanzania's food delivery platform. Be friendly, concise, and helpful. Use Swahili greetings naturally.`;
  }
}

exports.chat = async (req, res) => {
  const { message, conversationHistory = [], userId, orderId } = req.body;

  if (!message) return res.status(400).json({ error: 'message is required' });

  const messages = [
    ...conversationHistory,
    { role: 'user', content: message },
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: getSystemPrompt(),
      messages,
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error('AI chat error:', err.message);
    if (err.status === 401) {
      return res.status(500).json({ error: 'AI service authentication failed. Add a valid ANTHROPIC_API_KEY to server/.env' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }
    res.status(500).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
};
