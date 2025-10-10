// DBS Chatbot Test File
// This file is for testing OpenAI connection
// Use app.js as the main entry point

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const testOpenAI = async () => {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env file');
    return;
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('🧪 Testing OpenAI connection...');
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful DBS Bank assistant.' },
        { role: 'user', content: 'Hello, test connection' }
      ],
      max_tokens: 50
    });

    console.log('✅ OpenAI connection successful!');
    console.log('🤖 Response:', response.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error.message);
    if (error.code === 'invalid_api_key') {
      console.error('🔑 Please check your OpenAI API key in .env file');
    }
  }
};

// Run test
testOpenAI();