#!/bin/bash
# Setup script for Hugging Face integration

echo "🤗 Setting up DBS Chatbot with Hugging Face"

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+"
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r python-requirements.txt

# Test the Hugging Face service
echo "🧪 Testing Hugging Face service..."
cd services
python huggingfaceService.py test

echo "✅ Hugging Face setup complete!"
echo "🚀 To start the services:"
echo "   1. Start Hugging Face service: python services/huggingfaceService.py"
echo "   2. Start Node.js chatbot: node app.js"