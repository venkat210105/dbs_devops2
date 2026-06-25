import express from "express";
import { handleMessage } from "../controllers/mockChatController.js";

const router = express.Router();

// Mock chat endpoint for testing without OpenAI credits
router.post("/test", handleMessage);

// Add a simple test endpoint
router.get("/test", (req, res) => {
  res.json({
    message: "Universal Chatbot Test Endpoint",
    status: "ready",
    mockMode: true,
    usage: {
      method: "POST",
      endpoint: "/api/chat/test",
      body: {
        sessionId: "test-session",
        message: "I want to submit feedback"
      }
    }
  });
});

export default router;