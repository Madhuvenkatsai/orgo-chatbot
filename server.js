require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let systemPrompt = '';
try {
  systemPrompt = fs.readFileSync(path.join(__dirname, 'system-prompt.txt'), 'utf-8').trim();
  console.log('System prompt loaded.');
} catch (err) { process.exit(1); }
const sessions = {};
app.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required.' });
  const sid = sessionId || 'default';
  if (!sessions[sid]) sessions[sid] = [];
  sessions[sid].push({ role: 'user', content: message.trim() });
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...sessions[sid]],
      max_tokens: 1024,
    });
    const reply = response.choices[0].message.content;
    sessions[sid].push({ role: 'assistant', content: reply });
    return res.json({ reply });
  } catch (err) {
    console.error('Groq error:', err.message);
    return res.status(500).json({ error: 'Failed to get a response.' });
  }
});
app.listen(3000, () => console.log('Orgo Chatbot running at http://localhost:3000'));
