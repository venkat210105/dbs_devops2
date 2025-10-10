import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./FeedbackList.css";

const FeedbackList = ({ refreshTrigger }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFeedback, setExpandedFeedback] = useState(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8085/feedback/all");
      setFeedbacks(res.data);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback, refreshTrigger]);

  const toggleExpand = (id) => {
    setExpandedFeedback(expandedFeedback === id ? null : id);
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment || sentiment === 'Processing...') return '#6b7280';
    switch (sentiment.toLowerCase()) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getSentimentIcon = (sentiment) => {
    if (!sentiment || sentiment === 'Processing...') return '⏳';
    switch (sentiment.toLowerCase()) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '💬';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="feedback-list-container">
        <div className="feedback-list-header">
          <h2>All Feedback</h2>
          <div className="loading-spinner"></div>
        </div>
        <div className="loading-state">
          <div className="loading-content">
            <div className="loading-icon">📝</div>
            <p>Loading feedback entries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-list-container">
      <div className="feedback-list-header">
        <div className="header-content">
          <h2>All Feedback</h2>
          <span className="feedback-count">{feedbacks.length} entries</span>
        </div>
        <button onClick={fetchFeedback} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {feedbacks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No Feedback Yet</h3>
          <p>Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="feedback-grid">
          {feedbacks.map((feedback) => (
            <div 
              key={feedback.id} 
              className={`feedback-card ${expandedFeedback === feedback.id ? 'expanded' : ''}`}
              onClick={() => toggleExpand(feedback.id)}
            >
              <div className="feedback-header">
                <div className="customer-info">
                  <div className="avatar">
                    {feedback.customerName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="customer-details">
                    <h4 className="customer-name">{feedback.customerName || 'Anonymous'}</h4>
                    <span className="feedback-date">{formatDate(feedback.createdAt)}</span>
                  </div>
                </div>
                <div className="rating-sentiment">
                  <div className="rating-display">
                    <span className="rating-stars">
                      {"★".repeat(feedback.rating)}{"☆".repeat(5 - feedback.rating)}
                    </span>
                    <span className="rating-value">({feedback.rating}/5)</span>
                  </div>
                  <span 
                    className="sentiment-badge"
                    style={{ backgroundColor: getSentimentColor(feedback.sentiment) }}
                  >
                    <span className="sentiment-icon">{getSentimentIcon(feedback.sentiment)}</span>
                    {feedback.sentiment || 'Processing...'}
                  </span>
                </div>
              </div>

              <div className="comment-section">
                <p className="comment-text">{feedback.comment}</p>
                {expandedFeedback === feedback.id && (
                  <div className="expanded-details">
                    <div className="detail-row">
                      <span className="detail-label">Submitted by:</span>
                      <span className="detail-value">
                        {feedback.userName} ({feedback.userEmail})
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Product ID:</span>
                      <span className="detail-value">#{feedback.productId}</span>
                    </div>
                    {feedback.createdAt && (
                      <div className="detail-row">
                        <span className="detail-label">Submitted on:</span>
                        <span className="detail-value">{formatDate(feedback.createdAt)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="feedback-footer">
                <span className="toggle-expand">
                  {expandedFeedback === feedback.id ? 'Show Less' : 'Show More'}
                </span>
                <span className="feedback-id">#{feedback.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackList;