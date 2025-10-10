# Minimal Working DBS Chatbot Service
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

class MinimalDBSAssistant:
    def __init__(self):
        self.conversation_state = {}
    
    def extract_info(self, messages):
        """Extract info from full conversation"""
        user_texts = []
        for msg in messages:
            if msg.get('role') == 'user':
                user_texts.append(msg.get('content', ''))
        
        full_text = ' '.join(user_texts)
        
        # Extract name
        name_patterns = [
            r"(?:i'm|i am|my name is|call me|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b"
        ]
        name = None
        for pattern in name_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                candidate = match.group(1).strip().title()
                # Avoid common false positives
                if not any(word in candidate.lower() for word in ['mobile', 'banking', 'feedback', 'excellent', 'good', 'bad']):
                    name = candidate
                    break
        
        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', full_text)
        email = email_match.group(0) if email_match else None
        
        # Extract rating
        rating_patterns = [
            r'(\d)\s*(?:star|stars|out of 5|\/5)',
            r'(?:rate|rating|give)\s*(?:it|is|:)?\s*(\d)',
            r'\b([1-5])\s*(?:star|stars)\b'
        ]
        rating = None
        for pattern in rating_patterns:
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                r = int(match.group(1))
                if 1 <= r <= 5:
                    rating = r
                    break
        
        # Extract service category
        service_category = "Digital Banking"  # Default
        if any(word in full_text.lower() for word in ['account', 'balance', 'deposit']):
            service_category = "Account Services"
        elif any(word in full_text.lower() for word in ['loan', 'credit', 'mortgage']):
            service_category = "Loan Services"
        elif any(word in full_text.lower() for word in ['support', 'help', 'customer service']):
            service_category = "Customer Service"
        elif any(word in full_text.lower() for word in ['investment', 'portfolio']):
            service_category = "Investment Services"
        
        return {
            'name': name,
            'email': email, 
            'rating': rating,
            'feedback': full_text,
            'serviceCategory': service_category,
            'complete': bool(name and email and rating and len(full_text) > 10)
        }
    
    def generate_response(self, messages, functions=None):
        """Generate response"""
        if not messages:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "Hello! I'm your DBS Bank assistant. I'm here to help you submit feedback about your banking experience. How can I assist you today?"
                    }
                }]
            }
        
        info = self.extract_info(messages)
        
        # If complete and functions available, submit
        if info['complete'] and functions:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": None,
                        "function_call": {
                            "name": "submit_feedback",
                            "arguments": json.dumps({
                                "customerName": info['name'],
                                "userEmail": info['email'],
                                "rating": info['rating'],
                                "feedback": info['feedback'],
                                "serviceCategory": info['serviceCategory'],
                                "serviceChannel": "Chatbot"
                            })
                        }
                    }
                }]
            }
        
        # Generate collection responses
        if not info['name']:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "Great! I'd love to help you submit feedback about your DBS banking experience. First, could you please tell me your full name?"
                    }
                }]
            }
        
        if not info['email']:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"Thank you, {info['name']}! Now I need your email address to complete your feedback submission."
                    }
                }]
            }
        
        if not info['rating']:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"Perfect! Now, {info['name']}, please rate your experience with {info['serviceCategory']} on a scale of 1-5 stars (1 = Poor, 5 = Excellent)."
                    }
                }]
            }
        
        # Need more details
        if len(info['feedback']) < 15:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"Thanks for the {info['rating']}-star rating! Could you share more details about your experience to help us improve our services?"
                    }
                }]
            }
        
        # Ready to submit
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": f"Perfect! I have all the information needed:\n✅ Name: {info['name']}\n✅ Email: {info['email']}\n✅ Rating: {info['rating']} stars\n✅ Feedback details collected\n\nWould you like me to submit your feedback now?"
                }
            }]
        }

# Initialize assistant
assistant = MinimalDBSAssistant()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'DBS Hugging Face Assistant',
        'model': 'Minimal DBS Banking Assistant'
    })

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        messages = data.get('messages', [])
        functions = data.get('functions', [])
        
        response = assistant.generate_response(messages, functions)
        return jsonify(response)
    
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            'choices': [{
                'message': {
                    'role': 'assistant',
                    'content': f'I apologize, but I encountered an error: {str(e)}. Please try again or contact DBS customer service directly.'
                }
            }]
        }), 500

if __name__ == '__main__':
    print("🚀 Minimal DBS Service Starting...")
    print("📍 Running on: http://localhost:5001")
    print("💬 Ready for DBS feedback collection!")
    
    app.run(host='0.0.0.0', port=5001, debug=False)