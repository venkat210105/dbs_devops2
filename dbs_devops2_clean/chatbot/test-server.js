import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'DBS Chatbot - Minimal Test',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat/message', (req, res) => {
  const { message } = req.body;
  res.json({
    reply: `Echo: ${message} (This is a test response)`,
    success: true,
    testMode: true
  });
});

const port = 4000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${port}`);
  console.log(`🌐 Health: http://localhost:${port}/health`);
  console.log(`💬 Chat: http://localhost:${port}/api/chat/message`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});