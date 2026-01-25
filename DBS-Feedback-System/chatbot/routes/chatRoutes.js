import express from "express";
import { handleMessage } from "../controllers/huggingfaceChatController.js";
const router = express.Router();

router.post("/message", handleMessage); // { sessionId, message }

// Health check for chat service
router.get("/health", (req, res) => {
  const aiService = process.env.AI_SERVICE || 'huggingface';
  res.json({
    status: "healthy",
    service: "DBS Chat API",
    aiService,
    timestamp: new Date().toISOString()
  });
});

export default router;
