import axios from "axios";

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
    console.log("📡 Calling Hugging Face service at http://localhost:5001/chat");
    
    const response = await axios.post('http://localhost:5001/chat', {
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
  const { sessionId, message } = req.body;
  
  // Input validation
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  console.log(`🤖 Processing message: "${message}"`);

  // Enhanced system prompt for DBS assistant
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
  
  const messages = [system, { role: "user", content: message }];

  try {
    console.log(`📡 Calling Hugging Face AI service...`);
    const resp = await callHuggingFaceService(messages, functions);
    const choice = resp.choices?.[0];
    
    if (choice?.message?.function_call) {
      const fn = choice.message.function_call;
      console.log(`🔧 Function called: ${fn.name}`);
      
      if (fn.name === "submit_feedback") {
        try {
          const args = JSON.parse(fn.arguments);
          console.log(`📝 Submitting feedback:`, args);
          
          // For now, simulate backend call (replace with actual backend when ready)
          const mockBackendResponse = {
            id: Math.floor(Math.random() * 10000),
            message: "Feedback submitted successfully",
            timestamp: new Date().toISOString()
          };
          
          console.log(`✅ Mock backend response:`, mockBackendResponse);
          
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
      console.log(`💬 Regular response: ${choice?.message?.content}`);
      return res.json({ 
        reply: choice?.message?.content || "I'm here to help you submit feedback to DBS Bank. How can I assist you today?",
        huggingFaceMode: true
      });
    }
    
  } catch (err) {
    console.error("Chatbot error:", err.message);
    
    return res.status(500).json({ 
      error: "I'm experiencing technical difficulties. Please try again or contact DBS customer service.",
      details: err.message
    });
  }
}