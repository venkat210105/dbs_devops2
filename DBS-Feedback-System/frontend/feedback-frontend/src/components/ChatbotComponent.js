import React, { useState, useEffect, useRef } from 'react';
import './ChatbotComponent.css';

const ChatbotComponent = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Universal Bank assistant. How can I help you submit feedback about your banking experience today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    // Create a stable session id per tab load
    const existing = sessionStorage.getItem('universalChatSessionId');
    if (existing) return existing;
    const id = `web-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
    sessionStorage.setItem('universalChatSessionId', id);
    return id;
  });
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Allow runtime override via window.__CHATBOT_URL__ if present, then env, then sensible default
  const chatbotBase = (typeof window !== 'undefined' && window.__CHATBOT_URL__) 
    || process.env.REACT_APP_CHATBOT_URL 
    || 'http://localhost:4000';

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call Node chatbot API which proxies to HF or OpenAI
      const response = await fetch(`${chatbotBase}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId, message: userMessage.content })
      });

      const data = await response.json();
      const reply = data.reply || data.message || data.choices?.[0]?.message?.content;
      if (reply) {
        const assistantMessage = { role: 'assistant', content: reply, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact customer service directly.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedbackToBackend = async (feedbackData) => {
    try {
      const response = await fetch('http://localhost:8085/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userName: feedbackData.customerName,
          userEmail: feedbackData.userEmail,
          productId: 1,
          rating: feedbackData.rating,
          comment: feedbackData.feedback,
          customerName: feedbackData.customerName,
          serviceCategory: feedbackData.serviceCategory,
          serviceChannel: feedbackData.serviceChannel || 'Chatbot',
          customerType: 'Individual',
          businessUnit: 'Retail Banking',
          feedback: feedbackData.feedback,
          email: feedbackData.userEmail
        })
      });

      if (response.ok) {
        const result = await response.json();
        const successMessage = {
          role: 'assistant',
          content: `✅ Thank you ${feedbackData.customerName}! Your feedback has been successfully submitted. 

📋 **Feedback Summary:**

We appreciate your ${feedbackData.rating}-star rating and will review your feedback to improve our services. You can reference this feedback using ID #${result.id}.`,
          timestamp: new Date(),
          isSuccess: true
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Backend submission error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I was able to process your feedback, but there was an issue submitting it to our system. Please try again or contact customer service.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot Toggle Button */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Feedback Assistant"
      >
        <div className="chatbot-icon">
          {isOpen ? '✕' : '💬'}
        </div>
        <span className="chatbot-label">Feedback Assistant</span>
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <img src="/logo.png" alt="Logo" className="chatbot-logo" />
              <div>
                <h3>Feedback Assistant</h3>
                <span className="status">🟢 Online</span>
              </div>
            </div>
            <button 
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.role} ${message.isError ? 'error' : ''} ${message.isSuccess ? 'success' : ''}`}
              >
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message about our services..."
              disabled={isLoading}
              rows={1}
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="send-button"
              aria-label="Send message"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button 
              onClick={() => setInputMessage('I want to give feedback about the mobile application')}
              disabled={isLoading}
            >
              📱 Mobile Banking Feedback
            </button>
            <button 
              onClick={() => setInputMessage('I had an excellent experience at the branch')}
              disabled={isLoading}
            >
              🏢 Branch Experience
            </button>
            <button 
              onClick={() => setInputMessage('I want to rate your online banking service')}
              disabled={isLoading}
            >
              💻 Online Banking
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotComponent;