export async function handleMessage(req, res) {
  const { message } = req.body || {};
  const reply = message && message.trim()
    ? `Mock: I received your message: "${message}". For full functionality, use /api/chat/message.`
    : 'Mock: Send a message in the "message" field to test.';
  return res.json({ reply, mock: true });
}
