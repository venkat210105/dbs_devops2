from flask import Flask, request, jsonify
import time

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    text = data.get('text', '')
    
    # Simulate processing time (this is what was causing your delay!)
    time.sleep(2)  # 2 second delay to simulate ML processing
    
    # Simple rule-based sentiment analysis for testing
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic']):
        return jsonify({'label': 'POSITIVE', 'score': 0.8})
    elif any(word in text_lower for word in ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing']):
        return jsonify({'label': 'NEGATIVE', 'score': 0.2})
    else:
        return jsonify({'label': 'NEUTRAL', 'score': 0.5})

if __name__ == '__main__':
    print("Starting Mock Sentiment Analysis Service on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)