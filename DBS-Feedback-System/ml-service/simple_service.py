import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

class SimpleUniversal:
    def __init__(self):
        self.conversations = {}
    
    def process_message(self, messages, functions):
        """Simple conversation processor"""
        if not messages:
            return "Hello! I'm your Universal assistant. How can I help you submit feedback?"
        
        # Get user messages
        user_msgs = [m['content'] for m in messages if m['role'] == 'user']
        conversation = ' '.join(user_msgs)
        
        # Extract info
        import re
        
        # Name extraction
        name_match = re.search(r"(?:i'm|i am|my name is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", conversation, re.IGNORECASE)
        name = name_match.group(1).title() if name_match else None
        
        # Email extraction
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', conversation)
        email = email_match.group(0) if email_match else None
        
        # Rating extraction
        rating_match = re.search(r'\b([1-5])\s*(?:star|stars|out of 5|\/5|\b)', conversation, re.IGNORECASE)
        rating = int(rating_match.group(1)) if rating_match else None
        
        # Check if we have complete info
        has_name = name is not None
        has_email = email is not None
        has_rating = rating is not None
        has_feedback = len(conversation.split()) > 10
        
        # If complete and functions available, submit
        if has_name and has_email and has_rating and has_feedback and functions:
            return {
                "role": "assistant",
                "content": None,
                "function_call": {
                    "name": "submit_feedback",
                    "arguments": json.dumps({
                        "customerName": name,
                        "userEmail": email,
                        "rating": rating,
                        "feedback": conversation,
                        "serviceCategory": "Digital Banking",
                        "serviceChannel": "Chatbot"
                    })
                }
            }
        
        # Generate collection response
        missing = []
        if not has_name: missing.append("name")
        if not has_email: missing.append("email")
        if not has_rating: missing.append("rating")
        if not has_feedback: missing.append("details")
        
        if "name" in missing:
            return "Great! To submit your feedback, I need your full name first."
        elif "email" in missing:
            return f"Thank you! Now I need your email address, {name}."
        elif "rating" in missing:
            return f"Perfect! Please rate your experience from 1-5 stars (5 = excellent)."
        elif "details" in missing:
            return f"Thanks for the {rating}-star rating! Could you share more details about your experience?"
        else:
            return "I have all the info! Ready to submit your feedback?"

assistant = SimpleUniversal()

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Universal Hugging Face Assistant',
        'model': 'Simple Universal Banking Assistant'
    })

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        messages = data.get('messages', [])
        functions = data.get('functions', [])
        
        response = assistant.process_message(messages, functions)
        
        if isinstance(response, dict):  # Function call
            return jsonify({
                "choices": [{"message": response}]
            })
        else:  # Regular message
            return jsonify({
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": response
                    }
                }]
            })
    except Exception as e:
        return jsonify({
            "choices": [{
                "message": {
                    "role": "assistant", 
                    "content": f"Sorry, I had an error: {str(e)}"
                }
            }]
        }), 500

if __name__ == '__main__':
    print("🚀 Simple Universal Service starting on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)