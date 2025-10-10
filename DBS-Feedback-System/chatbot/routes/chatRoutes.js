import express from "express";
import { handleMessage } from "../controllers/huggingfaceChatController.js";
const router = express.Router();

router.post("/message", handleMessage); // { sessionId, message }

// Health check for chat service
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "DBS Chat API",
    aiService: "Hugging Face",
    timestamp: new Date().toISOString()
  });
});

export default router;
