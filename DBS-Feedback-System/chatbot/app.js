import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import chatRoutes from "./routes/chatRoutes.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'DBS Chatbot Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Import test routes
import testRoutes from "./routes/testRoutes.js";

// API routes
app.use("/api/chat", chatRoutes);
app.use("/api/chat", testRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DBS Chatbot Service',
    status: 'running',
    endpoints: {
      health: '/health',
      chat: '/api/chat/message'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const port = process.env.PORT || 4002; // Changed port to avoid conflicts

// Add process error handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log('🤖 DBS Chatbot Service started');
  console.log(`📡 Server running on port ${port}`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${port}/api/chat/message`);
  
  // Check AI service configuration
  const aiService = process.env.AI_SERVICE || 'openai';
  console.log(`🤗 AI Service: ${aiService}`);
  
  // Check environment variables
  if (!process.env.OPENAI_API_KEY && aiService === 'openai') {
    console.warn('⚠️  Warning: OPENAI_API_KEY not set');
  }
  if (!process.env.BACKEND_BASE_URL) {
    console.warn('⚠️  Warning: BACKEND_BASE_URL not set');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});
