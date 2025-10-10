@echo off
REM Setup script for Hugging Face integration on Windows

echo 🤗 Setting up DBS Chatbot with Hugging Face

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+
    exit /b 1
)

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r python-requirements.txt

REM Test the Hugging Face service
echo 🧪 Testing Hugging Face service...
cd services
python huggingfaceService.py test
cd ..

echo ✅ Hugging Face setup complete!
echo 🚀 To start the services:
echo    1. Start Hugging Face service: python services/huggingfaceService.py
echo    2. Start Node.js chatbot: node app.js

pause