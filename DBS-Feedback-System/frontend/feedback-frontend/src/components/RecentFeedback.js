import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RecentFeedback.css';

export default function RecentFeedback({ recentFeedback, darkMode }) {
  const navigate = useNavigate();

  const handleCustomerClick = (feedback) => {
    const email = feedback.email || feedback.userEmail;
    const name = feedback.customerName || feedback.userName;
    
    if (email || name) {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (name) params.append('name', name);
      navigate(`/feedback-history?${params.toString()}`);
    }
  };

  if (!recentFeedback || !Array.isArray(recentFeedback) || recentFeedback.length === 0) {
    return (
      <div className="recent-feedback-container">
        <div className="recent-feedback-header">
          <h2>Recent Feedback</h2>
          <span className="feedback-count">No feedback available</span>
        </div>
        <div className="no-feedback">
          <div className="no-feedback-icon">💬</div>
          <p>No recent feedback to display</p>
        </div>
      </div>
    );
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '💬';
    }
  };

  return (
    <div className={`recent-feedback-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="recent-feedback-header">
        <h2>Recent Feedback</h2>
        <span className="feedback-count">{recentFeedback.length} entries</span>
      </div>

      <div className="feedback-table-container">
        <table className="feedback-table">
          <thead>
            <tr>
              <th className="id-column">ID</th>
              <th className="customer-column">Customer</th>
              <th className="service-column">Service Details</th>
              <th className="comment-column">Feedback</th>
              <th className="sentiment-column">Sentiment & Rating</th>
              <th className="date-column">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentFeedback.map((feedback, index) => (
              <tr key={feedback.id || index} className="feedback-row">
                <td className="id-cell">
                  <span className="feedback-id">#{feedback.id}</span>
                </td>
                <td className="customer-cell">
                  <div className="customer-info">
                    <div 
                      className="customer-name clickable-name" 
                      onClick={() => handleCustomerClick(feedback)}
                      title="Click to view this customer's feedback history"
                    >
                      {feedback.customerName || 'N/A'}
                    </div>
                    <div className="customer-email">{feedback.email || feedback.userEmail || 'N/A'}</div>
                    <div className="customer-type">{feedback.customerType || 'N/A'}</div>
                  </div>
                </td>
                <td className="service-cell">
                  <div className="service-info">
                    <div className="service-category">{feedback.serviceCategory || 'N/A'}</div>
                    <div className="service-channel">{feedback.serviceChannel || 'N/A'}</div>
                    <div className="business-unit">{feedback.businessUnit || 'N/A'}</div>
                  </div>
                </td>
                <td className="comment-cell">
                  <div className="comment-content">
                    <p className="comment-text">
                      {feedback.feedback || feedback.comment || 'No feedback provided'}
                    </p>
                  </div>
                </td>
                <td className="sentiment-cell">
                  <span 
                    className="sentiment-badge"
                    style={{ backgroundColor: getSentimentColor(feedback.label) }}
                  >
                    <span className="sentiment-icon">{getSentimentIcon(feedback.label)}</span>
                    {feedback.label || 'Unknown'}
                  </span>
                  {feedback.rating && (
                    <div className="rating-display">
                      <span className="rating-stars">
                        {"★".repeat(feedback.rating)}{"☆".repeat(5 - feedback.rating)}
                      </span>
                      <span className="rating-number">({feedback.rating}/5)</span>
                    </div>
                  )}
                </td>
                <td className="date-cell">
                  <div className="date-info">
                    {feedback.createdAt || 'N/A'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}