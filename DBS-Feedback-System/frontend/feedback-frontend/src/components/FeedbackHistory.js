import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import './FeedbackHistory.css';
import { Icon, IconSmile, IconFrown, IconMeh, IconInbox, IconXCircle } from './icons/OutlineIcons.jsx';
import TopNavBar from './TopNavBar';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';

const FeedbackHistory = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const customerEmail = searchParams.get('email');
  const customerName = searchParams.get('name');
  const sentimentFilter = searchParams.get('sentiment');

  useEffect(() => {
    fetchFeedbackHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, sentimentFilter]);

  const fetchFeedbackHistory = async () => {
    try {
      setLoading(true);
  const response = await axios.get(`${API_BASE}/feedback/all`);
      const mapped = (response.data || []).map(f => {
        const sentiment = (f.sentiment || f.sentimentLabel || f.label || 'Unknown').toString();
        const comment = f.comment || f.feedback || '';
        const customerName = f.customerName || f.userName || 'N/A';
        const email = f.email || f.userEmail || 'N/A';
        const rating = typeof f.rating === 'number' ? f.rating : (parseInt(f.rating, 10) || 0);
        let createdAt = f.createdAt;
        try {
          if (createdAt && typeof createdAt === 'object') {
            if (typeof createdAt.time === 'number') {
              createdAt = new Date(createdAt.time).toISOString();
            } else if (typeof createdAt.seconds === 'number') {
              createdAt = new Date(createdAt.seconds * 1000).toISOString();
            }
          }
        } catch {}
        return { ...f, sentiment, comment, customerName, email, rating, createdAt };
      });
      setFeedbacks(mapped);
    } catch (err) {
      console.error('Error fetching feedback history:', err);
      setError('Failed to fetch feedback history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = feedbacks;

    // Filter by user if provided
    if (customerEmail || customerName) {
      filtered = filtered.filter(feedback => 
        (customerEmail && ((feedback.email || feedback.userEmail) === customerEmail)) ||
        (customerName && ((feedback.customerName || feedback.userName) === customerName))
      );
    }

    // Filter by sentiment if provided
    if (sentimentFilter) {
      filtered = filtered.filter(feedback => {
        const s = (feedback.sentiment || feedback.sentimentLabel || feedback.label || '').toLowerCase();
        return s === sentimentFilter.toLowerCase();
      });
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredFeedbacks(filtered);
  };

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
      case 'positive': return <Icon><IconSmile /></Icon>;
      case 'negative': return <Icon><IconFrown /></Icon>;
      case 'neutral': return <Icon><IconMeh /></Icon>;
      default: return <Icon><IconMeh /></Icon>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const goBack = () => {
    navigate('/dashboard');
  };

  const getPageTitle = () => {
    if (customerName || customerEmail) {
      return `Feedback History - ${customerName || customerEmail}`;
    }
    if (sentimentFilter) {
      return `${sentimentFilter.charAt(0).toUpperCase() + sentimentFilter.slice(1)} Feedback`;
    }
    return 'All Feedback History';
  };

  const getPageSubtitle = () => {
    if (sentimentFilter && (customerName || customerEmail)) {
      return `${sentimentFilter.charAt(0).toUpperCase() + sentimentFilter.slice(1)} feedback from ${customerName || customerEmail}`;
    }
    if (sentimentFilter) {
      return `Showing all ${sentimentFilter.toLowerCase()} feedback entries`;
    }
    if (customerName || customerEmail) {
      return `All feedback entries from this customer`;
    }
    return 'Complete feedback history across all customers';
  };

  if (loading) {
    return (
      <div className="feedback-history-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading feedback history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-history-container">
        <div className="error-state">
          <div className="error-icon"><Icon><IconXCircle /></Icon></div>
          <h3>Error Loading Feedback</h3>
          <p>{error}</p>
          <button onClick={fetchFeedbackHistory} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-history-container">
      <TopNavBar title="Feedback History" icon={<TableRowsOutlinedIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#0b0f19' }} />} />
      {/* Header */}
      <div className="history-header">
        <div className="header-content">
          <button onClick={goBack} className="back-btn">
            ← Back to Dashboard
          </button>
          <div className="header-info">
            <h1>{getPageTitle()}</h1>
            <p className="header-subtitle">{getPageSubtitle()}</p>
            <div className="results-count">
              <span className="count-badge">{filteredFeedbacks.length}</span>
              <span>feedback entries found</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      {filteredFeedbacks.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon"><Icon><IconInbox /></Icon></div>
          <h3>No Feedback Found</h3>
          <p>No feedback entries match your current filters.</p>
          <button onClick={goBack} className="back-to-dashboard-btn">
            Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="feedback-list">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.id} className="feedback-item">
              <div className="feedback-header-row">
                <div className="feedback-id">#{feedback.id}</div>
                <div className="feedback-date">{formatDate(feedback.createdAt)}</div>
                <div className="sentiment-indicator">
                  <span 
                    className="sentiment-badge"
                    style={{ backgroundColor: getSentimentColor(feedback.sentiment || feedback.sentimentLabel) }}
                  >
                    <span className="sentiment-icon">{getSentimentIcon(feedback.sentiment || feedback.sentimentLabel)}</span>
                    {feedback.sentiment || feedback.sentimentLabel || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="feedback-content">
                <div className="customer-info-section">
                  <h4>Customer Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{feedback.customerName || feedback.userName || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{feedback.email || feedback.userEmail || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Customer Type:</span>
                      <span className="info-value">{feedback.customerType || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Rating:</span>
                      <div className="rating-display">
                        <span className="rating-stars">
                          {"★".repeat(feedback.rating)}{"☆".repeat(5 - feedback.rating)}
                        </span>
                        <span className="rating-number">({feedback.rating}/5)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="service-info-section">
                  <h4>Service Details</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Category:</span>
                      <span className="info-value service-tag">{feedback.serviceCategory || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Channel:</span>
                      <span className="info-value channel-tag">{feedback.serviceChannel || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Business Unit:</span>
                      <span className="info-value business-tag">{feedback.businessUnit || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Product ID:</span>
                      <span className="info-value">{feedback.productId || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="feedback-text-section">
                  <h4>Feedback</h4>
                  <div className="feedback-text">
                    {feedback.feedback || feedback.comment || 'No feedback text provided'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackHistory;