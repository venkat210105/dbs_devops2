# DBS Chatbot - Enhanced Conversation Flow Service
# Improved feedback collection with better conversation management

import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS

class EnhancedDBSAssistant:
    def __init__(self):
        self.service_categories = [
            "Account Services", "Loan Services", "Investment Services", 
            "Digital Banking", "Customer Service", "Credit Cards", "Other"
        ]
        
        self.service_channels = [
            "Branch", "Online Banking", "Mobile App", "Phone", "ATM", "Other"
        ]
    
    def extract_info_from_conversation(self, messages):
        """Extract all information from the entire conversation"""
        user_messages = [msg['content'] for msg in messages if msg['role'] == 'user']
        full_text = ' '.join(user_messages)
        
        return {
            'name': self.extract_name(full_text),
            'email': self.extract_email(full_text),
            'rating': self.extract_rating(full_text),
            'service_category': self.extract_service_category(full_text),
            'service_channel': self.extract_service_channel(full_text),
            'feedback_text': full_text
        }
    
    def extract_name(self, text):
        """Extract customer name"""
        patterns = [
            r"(?:i'm|i am|my name is|call me|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s|,|\.|!|$)",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                # Validate it's a reasonable name (not common words)
                common_words = ['hello', 'good', 'bad', 'great', 'thank', 'please', 'mobile', 'banking']
                if len(name.split()) <= 3 and not any(word.lower() in name.lower() for word in common_words):
                    return name.title()
        return None
    
    def extract_email(self, text):
        """Extract email address"""
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(pattern, text)
        return match.group(0) if match else None
    
    def extract_rating(self, text):
        """Extract rating from 1-5"""
        patterns = [
            r'(\d)\s*(?:star|stars|out of 5|\/5)',
            r'(?:rate|rating|give)\s*(?:it|is|:)?\s*(\d)',
            r'\b([1-5])\s*(?:star|stars)\b',
            r'\b([1-5])\/5\b',
            r'(?:^|\s)([1-5])(?:\s|$|,|\.|!)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                rating = int(match)
                if 1 <= rating <= 5:
                    return rating
        return None
    
    def extract_service_category(self, text):
        """Extract service category"""
        text_lower = text.lower()
        
        categories = {
            "Digital Banking": ["mobile app", "online banking", "digital", "app", "website", "internet banking"],
            "Account Services": ["account", "savings", "checking", "deposit", "withdrawal", "balance"],
            "Loan Services": ["loan", "mortgage", "credit", "lending", "borrow"],
            "Investment Services": ["investment", "portfolio", "stocks", "bonds", "mutual funds"],
            "Customer Service": ["customer service", "support", "help", "representative", "call center"],
            "Credit Cards": ["credit card", "card", "payment", "billing"]
        }
        
        for category, keywords in categories.items():
            if any(keyword in text_lower for keyword in keywords):
                return category
        return "Other"
    
    def extract_service_channel(self, text):
        """Extract how customer accessed the service"""
        text_lower = text.lower()
        
        channels = {
            "Mobile App": ["mobile app", "app", "smartphone"],
            "Online Banking": ["online", "website", "web", "internet"],
            "Branch": ["branch", "office", "visit", "location", "in person"],
            "Phone": ["phone", "call", "telephone", "hotline"],
            "ATM": ["atm", "machine", "cash"]
        }
        
        for channel, keywords in channels.items():
            if any(keyword in text_lower for keyword in keywords):
                return channel
        return "Chatbot"
    
    def get_missing_fields(self, info):
        """Determine what information is still needed"""
        missing = []
        if not info['name']:
            missing.append('name')
        if not info['email']:
            missing.append('email')  
        if not info['rating']:
            missing.append('rating')
        if len(info['feedback_text'].split()) < 3:
            missing.append('feedback')
        return missing
    
    def generate_response(self, messages, functions=None):
        """Main response generation logic"""
        if not messages:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "Hello! I'm your DBS Bank assistant. I'm here to help you submit feedback about your banking experience. How can I assist you today?"
                    }
                }]
            }
        
        # Extract info from entire conversation
        info = self.extract_info_from_conversation(messages)
        missing = self.get_missing_fields(info)
        
        # Get latest user message
        user_messages = [msg for msg in messages if msg['role'] == 'user']
        latest_message = user_messages[-1]['content'] if user_messages else ""
        
        # If we have all info and functions available, submit feedback
        if not missing and functions:
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
                                "feedback": info['feedback_text'],
                                "serviceCategory": info['service_category'],
                                "serviceChannel": info['service_channel']
                            })
                        }
                    }
                }]
            }
        
        # Generate response to collect missing info
        return self.generate_collection_response(info, missing, latest_message)
    
    def generate_collection_response(self, info, missing, latest_message):
        """Generate response to collect missing information"""
        
        # Initial greeting and setup
        if len(missing) == 4:  # No info collected yet
            if any(word in latest_message.lower() for word in ['feedback', 'complaint', 'review', 'experience', 'rate']):
                return {
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": "I'd be happy to help you submit feedback about your DBS banking experience! 🏦\n\nTo get started, I'll need:\n• Your name\n• Email address  \n• A rating (1-5 stars)\n• Details about your experience\n\nWhat's your name?"
                        }
                    }]
                }
            else:
                return {
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": "Hello! I'm your DBS Banking assistant. I can help you submit feedback about your banking experience. Would you like to share some feedback about our services?"
                        }
                    }]
                }
        
        # Ask for name
        if 'name' in missing:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": "Great! Let's start with your full name please."
                    }
                }]
            }
        
        # Ask for email
        if 'email' in missing:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"Thank you, {info['name']}! Now I need your email address to complete the feedback submission."
                    }
                }]
            }
        
        # Ask for rating
        if 'rating' in missing:
            service = info['service_category'] if info['service_category'] != 'Other' else "DBS services"
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"Perfect! Now please rate your experience with {service} on a scale of 1-5 stars:\n\n⭐ 1 = Very Poor\n⭐⭐ 2 = Poor  \n⭐⭐⭐ 3 = Average\n⭐⭐⭐⭐ 4 = Good\n⭐⭐⭐⭐⭐ 5 = Excellent"
                    }
                }]
            }
        
        # Ask for more feedback details
        if 'feedback' in missing:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": f"Thanks for the {info['rating']}-star rating! Could you share more details about your experience? What specifically went well or could be improved?"
                    }
                }]
            }
        
        # Ready to submit
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": "Perfect! I have all the information needed:\n✅ Name, Email, Rating, and Feedback\n\nWould you like me to submit your feedback to DBS now?"
                }
            }]
        }

# Flask Application
app = Flask(__name__)
CORS(app)
assistant = EnhancedDBSAssistant()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'DBS Hugging Face Assistant',
        'model': 'Enhanced DBS Banking Assistant'
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
        print(f"Error: {str(e)}")
        return jsonify({
            'choices': [{
                'message': {
                    'role': 'assistant',
                    'content': 'I apologize for the technical issue. Please try again or contact DBS customer service directly.'
                }
            }]
        }), 500

if __name__ == '__main__':
    print("🚀 Enhanced DBS Banking Assistant Starting...")
    print("🔧 Features: Intelligent conversation flow, complete info extraction")
    print("📍 Running on: http://localhost:5001")
    print("💬 Ready to collect DBS customer feedback!")
    print("-" * 60)
    
    app.run(host='0.0.0.0', port=5001, debug=False)