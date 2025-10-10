import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchDashboardData } from "../api";
import SentimentChart from "./SentimentChart";
import TrendsChart from "./TrendsChart";
import RecentFeedback from "./RecentFeedback";
import './Dashboard.css';

export default function Dashboard() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const oauthCode = params.get('code');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchDashboardData();
      setData(result);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSentimentClick = (sentiment) => {
    navigate(`/feedback-history?sentiment=${sentiment.toLowerCase()}`);
  };

  // Apply dark mode to body element for global effect
  useEffect(() => {
    // No global dark mode CSS manipulation; rely on MUI theme
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p>Error loading dashboard: {error}</p>;
  if (!data) return <p>No dashboard data available.</p>;

  return (
    <div className={`dashboard-container light-mode`}>
      {oauthCode && (
        <div className="oauth-code-banner">
          <p>Received OAuth code: <b>{oauthCode}</b></p>
        </div>
      )}
      <div className="dashboard-header">
        <h2>Dashboard Insights</h2>
      </div>
      <div className="cards-container">
        <div 
          className="card clickable-card positive-card" 
          onClick={() => handleSentimentClick('positive')}
          title="Click to view all positive feedback"
        >
          <h3>Positive</h3>
          <p className="card-count">{data.sentimentCounts.POSITIVE || 0}</p>
          <span className="card-subtitle">Click to view details</span>
        </div>
        <div 
          className="card clickable-card neutral-card" 
          onClick={() => handleSentimentClick('neutral')}
          title="Click to view all neutral feedback"
        >
          <h3>Neutral</h3>
          <p className="card-count">{data.sentimentCounts.NEUTRAL || 0}</p>
          <span className="card-subtitle">Click to view details</span>
        </div>
        <div 
          className="card clickable-card negative-card" 
          onClick={() => handleSentimentClick('negative')}
          title="Click to view all negative feedback"
        >
          <h3>Negative</h3>
          <p className="card-count">{data.sentimentCounts.NEGATIVE || 0}</p>
          <span className="card-subtitle">Click to view details</span>
        </div>
      </div>
      <div className="charts-container">
        <div className="chart">
          <h3>Trends Over Time</h3>
          <TrendsChart trends={data.trends} />
        </div>
        <div className="chart">
          <h3>Sentiment Distribution</h3>
          <SentimentChart sentimentCounts={data.sentimentCounts} />
        </div>
      </div>
      <div className="recent-feedback">
        <h3>Recent Feedback</h3>
        <RecentFeedback recentFeedback={data.recentFeedback} />
      </div>
    </div>
  );
}
