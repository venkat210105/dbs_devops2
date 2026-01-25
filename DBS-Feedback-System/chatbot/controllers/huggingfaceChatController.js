import axios from "axios";

// In-memory conversation store keyed by sessionId
// Stores an array of messages in OpenAI format: [{ role: 'system'|'user'|'assistant', content: string }]
const conversationStore = new Map();

// Define function schemas for OpenAI function calling
const functions = [
  {
    name: "submit_feedback",
    description: "Submit customer feedback to DBS Bank system",
    parameters: {
      type: "object",
      properties: {
        customerName: {
          type: "string",
          description: "Customer's full name"
        },
        userEmail: {
          type: "string",
          description: "Customer's email address"
        },
        rating: {
          type: "integer",
          description: "Rating from 1-5",
          minimum: 1,
          maximum: 5
        },
        feedback: {
          type: "string",
          description: "Detailed feedback text"
        },
        serviceCategory: {
          type: "string",
          description: "Banking service category",
          enum: ["Account Services", "Loan Services", "Investment Services", "Digital Banking", "Customer Service", "Other"]
        },
        serviceChannel: {
          type: "string",
          description: "How customer accessed the service",
          enum: ["Branch", "Online Banking", "Mobile App", "Phone", "ATM", "Other"]
        },
        customerType: {
          type: "string",
          description: "Type of customer",
          enum: ["Individual", "Business", "Corporate", "Premium"]
        },
        businessUnit: {
          type: "string",
          description: "DBS business unit",
          enum: ["Retail Banking", "Corporate Banking", "Investment Banking", "Digital Bank", "Other"]
        }
      },
      required: ["customerName", "userEmail", "rating", "feedback", "serviceCategory"]
    }
  }
];

// Simple function to call Hugging Face service
async function callHuggingFaceService(messages, functions) {
  try {
    const base = process.env.HUGGINGFACE_URL || 'http://localhost:5001';
    const url = `${base}/chat`;
    console.log("📡 Calling Hugging Face service at", url);
    const response = await axios.post(url, {
      messages,
      functions,
      model: 'dbs-banking-assistant'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("✅ Hugging Face response received");
    return response.data;
    
  } catch (error) {
  console.error('❌ Hugging Face service error:', error.message);
    
    // Fallback response
    return {
      choices: [{
        message: {
          role: 'assistant',
          content: "I'm your DBS Bank assistant. I'm currently having technical difficulties connecting to our AI service, but I'm here to help you submit feedback. Could you tell me about your banking experience?"
        }
      }]
    };
  }
}

export async function handleMessage(req, res) {
  const { sessionId: rawSessionId, message } = req.body;

  // Input validation
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Normalize session id and initialize conversation with a system prompt if new
  const sessionId = (rawSessionId && String(rawSessionId).trim()) || 'default';
  console.log(`🤖 [${sessionId}] Processing message: "${message}"`);

  // Support a simple reset flow
  const lower = message.trim().toLowerCase();
  if (lower === 'reset' || lower === 'restart' || lower === 'start over') {
    conversationStore.delete(sessionId);
    return res.json({
      reply: "Chat reset. Hello! I'm your DBS Bank assistant. How can I help you submit feedback about your banking experience today?",
      reset: true
    });
  }

  // Enhanced system prompt for DBS assistant (only added once per session)
  const system = {
    role: "system",
    content: `You are a professional DBS Bank customer service assistant. Your role is to:
    
    1. Help customers submit feedback about DBS banking services
    2. Ask clarifying questions to gather complete feedback information
    3. Be professional, helpful, and empathetic
    4. Guide customers through the feedback process step by step
    5. Ensure you collect: customer name, email, rating (1-5), detailed feedback, service category, and service channel
    
    Always maintain DBS Bank's professional standards and be courteous in all interactions.
    When you have sufficient information, use the submit_feedback function to process their feedback.`
  };

  const history = conversationStore.get(sessionId) || [system];
  history.push({ role: 'user', content: message });

  try {
    const aiService = process.env.AI_SERVICE || 'huggingface';
    const isOrchestrator = aiService === 'orchestrator';
    let resp;
    if (isOrchestrator) {
      const base = process.env.ORCHESTRATOR_URL || 'http://orchestrator:5050';
      console.log(`🧠 [${sessionId}] Calling Orchestrator at ${base}/orchestrate`);
      const messages = history.map(m => ({ role: m.role, content: m.content }));
      const { data } = await axios.post(`${base}/orchestrate`, { sessionId, messages }, { timeout: 10000 });
      resp = { choices: [{ message: { role: 'assistant', content: data.reply } }] };
    } else {
      console.log(`📡 [${sessionId}] Calling Hugging Face AI service...`);
      resp = await callHuggingFaceService(history, functions);
    }
    const choice = resp.choices?.[0];
    
    if (choice?.message?.function_call) {
      const fn = choice.message.function_call;
      console.log(`🔧 [${sessionId}] Function called: ${fn.name}`);
      
      if (fn.name === "submit_feedback") {
        try {
          const args = JSON.parse(fn.arguments);
          console.log(`📝 [${sessionId}] Submitting feedback:`, args);

          // Validate required fields before acknowledging
          const missing = [];
          if (!args.customerName) missing.push('name');
          if (!args.userEmail) missing.push('email');
          if (!args.rating) missing.push('rating');
          if (!args.feedback || String(args.feedback).trim().length < 20) missing.push('feedback');

          if (missing.length > 0) {
            const nextPrompt = missing[0];
            let promptText = '';
            if (nextPrompt === 'feedback') {
              promptText = 'Thanks! Could you share a few sentences describing your experience so we understand the details better?';
            } else if (nextPrompt === 'email') {
              promptText = `Great, ${args.customerName || 'there'}! Please share your email address to complete your submission.`;
            } else if (nextPrompt === 'name') {
              promptText = 'To get started, could you please tell me your full name?';
            } else if (nextPrompt === 'rating') {
              promptText = 'On a scale of 1-5 stars, how would you rate your experience?';
            }
            // keep conversation and ask for missing
            history.push({ role: 'assistant', content: promptText });
            conversationStore.set(sessionId, history);
            return res.json({ reply: promptText, huggingFaceMode: true });
          }
          
          // For now, simulate backend call (replace with actual backend when ready)
          const mockBackendResponse = {
            id: Math.floor(Math.random() * 10000),
            message: "Feedback submitted successfully",
            timestamp: new Date().toISOString()
          };
          
          console.log(`✅ [${sessionId}] Mock backend response:`, mockBackendResponse);
          // Conversation complete; clear session to avoid repeated prompts
          conversationStore.delete(sessionId);
          
          return res.json({ 
            reply: `Thank you ${args.customerName}! Your feedback has been successfully submitted to DBS Bank. Your feedback ID is #${mockBackendResponse.id}. We appreciate your ${args.rating}-star rating and will review your comments about ${args.serviceCategory} to improve our services.`,
            success: true,
            feedbackId: mockBackendResponse.id,
            huggingFaceMode: true
          });
          
        } catch (error) {
          console.error("Function processing error:", error.message);
          return res.json({ 
            reply: "I apologize, but there was an issue processing your feedback. Please try again or contact DBS customer service directly.",
            error: true
          });
        }
      }
      
    } else {
      // Regular conversation response
      const reply = choice?.message?.content || "I'm here to help you submit feedback to DBS Bank. How can I assist you today?";
      console.log(`💬 [${sessionId}] Regular response: ${reply}`);
      // Persist assistant reply in conversation history to maintain context across turns
      history.push({ role: 'assistant', content: reply });
      conversationStore.set(sessionId, history);
      return res.json({ 
        reply,
        huggingFaceMode: !isOrchestrator,
        orchestratorMode: isOrchestrator,
        mode: aiService
      });
    }
    
  } catch (err) {
    console.error(`Chatbot error [${sessionId}]:`, err.message);
    
    return res.status(500).json({ 
      error: "I'm experiencing technical difficulties. Please try again or contact DBS customer service.",
      details: err.message
    });
  }
}