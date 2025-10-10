// Import AI service based on configuration
import { runAgent as huggingfaceAgent } from "../services/huggingfaceNodeService.js";
import { runAgent as openaiAgent } from "../services/openaiService.js";

let runAgent;
const aiService = process.env.AI_SERVICE || 'openai';

if (aiService === 'huggingface') {
  runAgent = huggingfaceAgent;
  console.log("🤗 Using Hugging Face AI service");
} else {
  runAgent = openaiAgent;
  console.log("🤖 Using OpenAI service");
}

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
  },
  {
    name: "get_feedback_status",
    description: "Check the status of submitted feedback",
    parameters: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Customer's email to check feedback status"
        }
      },
      required: ["email"]
    }
  }
];

export async function handleMessage(req, res) {
  const { sessionId, message } = req.body;
  
  // Input validation
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

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
    const resp = await runAgent(messages, functions);
    const choice = resp.choices?.[0];
    
    if (choice?.message?.function_call) {
      const fn = choice.message.function_call;
      
      if (fn.name === "submit_feedback") {
        try {
          const args = JSON.parse(fn.arguments);
          
          // Validate required fields
          if (!args.customerName || !args.userEmail || !args.rating || !args.feedback) {
            return res.json({ 
              reply: "I need more information. Please provide your name, email, rating (1-5), and detailed feedback to submit your feedback to DBS Bank." 
            });
          }
          
          // Call Spring Boot backend
          const backendRes = await axios.post(`${process.env.BACKEND_BASE_URL}/feedback/submit`, {
            userName: args.customerName,
            userEmail: args.userEmail,
            productId: 1, // Default product ID
            rating: parseInt(args.rating),
            comment: args.feedback,
            customerName: args.customerName,
            serviceCategory: args.serviceCategory || "General",
            serviceChannel: args.serviceChannel || "Chatbot",
            customerType: args.customerType || "Individual", 
            businessUnit: args.businessUnit || "Retail Banking",
            feedback: args.feedback,
            email: args.userEmail
          });
          
          // Generate final response
          messages.push(choice.message);
          messages.push({
            role: "function", 
            name: fn.name, 
            content: JSON.stringify({ success: true, feedback_id: backendRes.data.id })
          });
          
          const final = await runAgent(messages, []);
          return res.json({ 
            reply: final.choices[0].message.content,
            success: true,
            feedbackId: backendRes.data.id
          });
          
        } catch (backendError) {
          console.error("Backend error:", backendError.message);
          return res.json({ 
            reply: "I apologize, but there was an issue submitting your feedback to our system. Please try again later or contact DBS customer service directly.",
            error: true
          });
        }
      }
      
      else if (fn.name === "get_feedback_status") {
        // Handle feedback status checking
        return res.json({ 
          reply: "Feedback status checking is currently being implemented. Please contact DBS customer service for feedback status updates." 
        });
      }
      
    } else {
      // Regular conversation response
      return res.json({ 
        reply: choice?.message?.content || "I'm here to help you submit feedback to DBS Bank. How can I assist you today?" 
      });
    }
    
  } catch (err) {
    console.error("Chatbot error:", err?.response?.data || err.message);
    
    // Handle specific error types
    if (err.message.includes('API key')) {
      return res.status(500).json({ 
        error: "AI service configuration error. Please contact support." 
      });
    }
    
    return res.status(500).json({ 
      error: "I'm experiencing technical difficulties. Please try again or contact DBS customer service." 
    });
  }
}
