# DBS Chatbot - Hugging Face Service
# Free alternative to OpenAI using Hugging Face transformers

import json
import re
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

# Simple rule-based service that mimics AI responses
class DBSBankingAssistant:
    def __init__(self):
        # Banking service categories
        self.service_categories = [
            "Account Services", "Loan Services", "Investment Services", 
            "Digital Banking", "Customer Service", "Credit Cards", "Other"
        ]
        
        # Service channels
        self.service_channels = [
            "Branch", "Online Banking", "Mobile App", "Phone", "ATM", "Other"
        ]
        
        # Conversation state tracking
        self.conversation_state = {}
        
        # DBS responses for different intents
        self.responses = {
            'greeting': [
                "Hello! I'm your DBS Bank assistant. How can I help you submit feedback today?",
                "Welcome to DBS Bank feedback service. I'm here to assist you with your banking experience.",
                "Good day! I'm ready to help you share your feedback about DBS services."
            ],
            'feedback_intent': [
                "I'd be happy to help you submit feedback about your DBS banking experience. Could you tell me which service you'd like to provide feedback about?",
                "Thank you for wanting to share your experience with us. What specific DBS service would you like to give feedback on?",
                "I can help you submit detailed feedback. Please let me know about your recent banking experience."
            ],
            'service_inquiry': [
                "We offer feedback for various services including Account Services, Digital Banking, Loans, Investments, and Customer Service. Which one interests you?",
                "You can provide feedback about any of our banking services. What service did you recently use?"
            ],
            'rating_request': [
                "On a scale of 1-5, how would you rate your overall experience? (1 = Poor, 5 = Excellent)",
                "Please rate your experience from 1 to 5 stars, where 5 is excellent service."
            ],
            'details_request': [
                "Could you provide more details about your experience? This helps us improve our services.",
                "Please share more about what happened during your banking experience."
            ]
        }
    
    def analyze_intent(self, message):
        """Analyze user message to determine intent"""
        message_lower = message.lower()
        
        # Greeting patterns
        greeting_patterns = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening']
        if any(pattern in message_lower for pattern in greeting_patterns):
            return 'greeting'
        
        # Feedback intent patterns
        feedback_patterns = ['feedback', 'complaint', 'review', 'rating', 'experience', 'submit', 'report', 'issue', 'problem']
        if any(pattern in message_lower for pattern in feedback_patterns):
            return 'feedback_intent'
        
        # Service inquiry patterns
        service_patterns = ['service', 'account', 'loan', 'investment', 'digital banking', 'mobile app', 'website']
        if any(pattern in message_lower for pattern in service_patterns):
            return 'service_inquiry'
        
        # Rating patterns
        rating_patterns = ['rate', 'rating', 'stars', 'score', '1', '2', '3', '4', '5']
        if any(pattern in message_lower for pattern in rating_patterns):
            return 'rating_request'
        
        return 'general'
    
    def extract_feedback_info(self, message):
        """Extract potential feedback information from message"""
        import re
        
        # Extract rating (1-5)
        rating_match = re.search(r'\b([1-5])\b', message)
        rating = int(rating_match.group(1)) if rating_match else None
        
        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', message)
        email = email_match.group(0) if email_match else None
        
        # Check for complete feedback (has rating and substantial text)
        has_substantial_text = len(message.split()) > 10
        
        return {
            'rating': rating,
            'email': email,
            'has_substantial_feedback': has_substantial_text,
            'message': message
        }
    
    def extract_feedback_info(self, text):
        """Extract feedback information from text"""
        rating = self.extract_rating(text)
        has_substantial_feedback = len(text.strip()) > 20  # Basic check for substantial feedback
        
        return {
            'rating': rating,
            'has_substantial_feedback': has_substantial_feedback,
            'feedback_text': text
        }
    
    def should_call_function(self, message, functions):
        """Determine if we should call the submit_feedback function"""
        if not functions:
            return False
        
        feedback_info = self.extract_feedback_info(message)
        
        # Call function if we have rating and substantial feedback
        feedback_keywords = ['submit', 'send', 'done', 'finished', 'complete']
        has_submit_intent = any(keyword in message.lower() for keyword in feedback_keywords)
        
        return (feedback_info['rating'] is not None and 
                feedback_info['has_substantial_feedback']) or has_submit_intent
    
    def analyze_full_conversation(self, messages):
        """Analyze entire conversation to extract complete information"""
        user_messages = [msg.get('content', '') for msg in messages if msg.get('role') == 'user']
        full_conversation = ' '.join(user_messages)
        
        # Extract comprehensive info from full conversation
        latest_msg = user_messages[-1] if user_messages else ''
        # Prefer extracting name from the latest message (handles single-word replies like "john")
        name = self.extract_name_advanced(latest_msg) or self.extract_name_advanced(full_conversation)
        email = self.extract_email(full_conversation)
        rating = self.extract_rating(full_conversation)
        service_cat = self.extract_service_category_advanced(full_conversation)
        
        # Derive feedback text: prefer the latest user message if substantial
        feedback_text = None
        if latest_msg and len(latest_msg.strip()) >= 20:
            feedback_text = latest_msg.strip()
        else:
            # Find the longest substantial user message
            candidates = [m.strip() for m in user_messages if len(m.strip()) >= 20]
            if candidates:
                # pick the last substantial message assuming it's the detailed feedback
                feedback_text = candidates[-1]
        
        has_substantial_feedback = bool(feedback_text and len(feedback_text) >= 20)
        
        return {
            'name': name,
            'email': email,
            'rating': rating,
            'feedback': feedback_text,
            'serviceCategory': service_cat,
            'has_complete_info': bool(name and email and rating and has_substantial_feedback)
        }
    
    def extract_name_advanced(self, text):
        """Extract customer name with better patterns"""
        # Allow lowercase names and simple two-word names
        patterns = [
            # Phrases like: my name is john doe, call me john, I'm John Doe
            r"(?:i'm|i am|my name is|call me|name's)\s+([A-Za-z][A-Za-z]*(?:\s+[A-Za-z][A-Za-z]*)*)",
            # Fallback: at least two words that look like names
            r"\b([A-Za-z]{2,}(?:\s+[A-Za-z]{2,})+)\b"
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip()
                # Normalize spacing and capitalization
                return " ".join(part.capitalize() for part in candidate.split())
        # If the input looks like a single first name (e.g., "john"), accept it
        stripped = text.strip()
        if 2 <= len(stripped) <= 40 and re.fullmatch(r"[A-Za-z]+(?:[-\s][A-Za-z]+)?", stripped):
            return " ".join(part.capitalize() for part in stripped.split())
        return None
    
    def extract_service_category_advanced(self, text):
        """Enhanced service category extraction"""
        text_lower = text.lower()
        if any(word in text_lower for word in ['mobile', 'app', 'digital', 'online']):
            return "Digital Banking"
        elif any(word in text_lower for word in ['account', 'balance', 'deposit']):
            return "Account Services"
        elif any(word in text_lower for word in ['loan', 'credit', 'mortgage']):
            return "Loan Services"
        elif any(word in text_lower for word in ['investment', 'portfolio']):
            return "Investment Services"
        elif any(word in text_lower for word in ['support', 'help', 'service']):
            return "Customer Service"
        return "Other"
    
    def extract_email(self, text):
        """Extract email address from text"""
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(pattern, text)
        return match.group() if match else None
    
    def extract_rating(self, text):
        """Extract rating from text (1-5 scale)"""
        # Look for ratings in various formats
        patterns = [
            r'(?:rate|rating|score)\s*(?:is\s*)?(\d+)(?:/5|out of 5|\s*stars?)?',
            r'(\d+)\s*(?:out of 5|/5|\s*stars?)',
            r'(?:give|rating)\s*(?:it\s*)?(\d+)',
            r'\b([1-5])\s*(?:stars?|/5|out of 5)\b'
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                rating = int(match.group(1))
                return rating if 1 <= rating <= 5 else None
        return None

    def generate_response(self, messages, functions=None):
        """Generate response compatible with OpenAI format"""
        
        if not messages:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "Hello! I'm your DBS Bank assistant. I'm here to help you submit feedback about your banking experience. How can I assist you today?"
                    }
                }]
            }
        
        # Analyze full conversation for complete information
        conversation_info = self.analyze_full_conversation(messages)
        
        # If we have complete info and functions are available, submit feedback
        if conversation_info['has_complete_info'] and functions:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": None,
                        "function_call": {
                            "name": "submit_feedback",
                            "arguments": json.dumps({
                                "customerName": conversation_info['name'],
                                "userEmail": conversation_info['email'],
                                "rating": conversation_info['rating'],
                                "feedback": conversation_info['feedback'],
                                "serviceCategory": conversation_info['serviceCategory'],
                                "serviceChannel": "Chatbot"
                            })
                        }
                    }
                }]
            }
        
        # Generate conversational response to collect missing information
        user_messages = [msg.get('content', '') for msg in messages if msg.get('role') == 'user']
        latest_message = user_messages[-1] if user_messages else ""
        
        # Determine what information is missing and ask step by step
        if not conversation_info['name']:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "I'd be happy to help you submit feedback about your DBS banking experience! To get started, could you please tell me your full name?"
                    }
                }]
            }
        
        if not conversation_info['email']:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"Thank you, {conversation_info['name']}! Now I need your email address to complete your feedback submission."
                    }
                }]
            }
        
        if not conversation_info['rating']:
            service = conversation_info['serviceCategory'] or "our services"
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"Great! Now, on a scale of 1-5 stars, how would you rate your experience with {service}? (1 = Poor, 5 = Excellent)"
                    }
                }]
            }

        if not conversation_info['feedback']:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "Thanks! Could you share a few sentences describing your experience? Please include what went well or what we should improve."
                    }
                }]
            }
        
        # Default response for initial contact or general queries
        import random
        default_responses = [
            "Hello! I'm your DBS Bank assistant. I can help you submit feedback about your banking experience. What would you like to share?",
            "Thank you for contacting DBS Bank. I'm here to help you provide feedback about our services. How can I assist you?",
            "I'm ready to help you submit feedback about any DBS banking services. What's your experience been like?"
        ]
        
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": random.choice(default_responses)
                }
            }]
        }

# Flask API for Node.js integration
app = Flask(__name__)
CORS(app)

# Initialize the assistant
assistant = DBSBankingAssistant()

@app.route('/chat', methods=['POST'])
def chat():
    """API endpoint compatible with OpenAI format"""
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        functions = data.get('functions', [])
        
        result = assistant.generate_response(messages, functions)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": "I'm experiencing technical difficulties. Please try again."
                }
            }]
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "DBS Hugging Face Assistant",
        "model": "Custom DBS Banking Assistant"
    })

# Test function
def test_assistant():
    """Test the assistant with sample messages"""
    test_cases = [
        {"role": "user", "content": "Hello"},
        {"role": "user", "content": "I want to give feedback"},
        {"role": "user", "content": "I rate your service 5 stars, excellent experience with mobile banking"},
        {"role": "user", "content": "Submit my feedback please"}
    ]
    
    print("🧪 Testing DBS Banking Assistant:")
    for i, test_msg in enumerate(test_cases, 1):
        result = assistant.generate_response([test_msg])
        print(f"\nTest {i}:")
        print(f"User: {test_msg['content']}")
        print(f"Assistant: {result['choices'][0]['message']['content']}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_assistant()
    else:
        print("🤗 Starting DBS Hugging Face Service on port 5001")
        app.run(host='0.0.0.0', port=5001, debug=True)