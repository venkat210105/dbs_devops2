import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './TrendsChart.css';

export default function TrendsChart({ trends }) {
  if (!trends || !Array.isArray(trends)) {
    return (
      <div className="trends-chart-container">
        <div className="chart-header">
          <h3>Feedback Trends Over Time</h3>
          <div className="chart-subtitle">Track feedback volume and patterns</div>
        </div>
        <div className="no-data-state">
          <div className="no-data-icon">📈</div>
          <p>No trends data available</p>
          <span className="no-data-help">Feedback data will appear here over time</span>
        </div>
      </div>
    );
  }

  // Format dates for better display
  const formattedData = trends.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));

  const totalFeedback = trends.reduce((sum, item) => sum + item.count, 0);
  const averagePerDay = totalFeedback / trends.length;

  return (
    <div className="trends-chart-container">
      <div className="chart-header">
        <div className="header-content">
          <h3>Feedback Trends Over Time</h3>
          <div className="chart-subtitle">Track feedback volume and patterns</div>
        </div>
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">{totalFeedback}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg/Day</span>
            <span className="stat-value">{averagePerDay.toFixed(1)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Period</span>
            <span className="stat-value">{trends.length}d</span>
          </div>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart 
            data={formattedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#f0f0f0" 
              vertical={false} 
            />
            <XAxis 
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              width={40}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="url(#trendGradient)"
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#ffffff' }}
              activeDot={{ 
                r: 6, 
                fill: '#059669', 
                stroke: '#ffffff', 
                strokeWidth: 3,
                style: { filter: 'drop-shadow(0 2px 4px rgba(5, 150, 105, 0.3))' }
              }}
            />
            <defs>
              <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="trend-indicators">
        <div className="trend-indicator">
          <div className="indicator-dot" style={{ backgroundColor: '#10b981' }}></div>
          <span>Feedback Volume</span>
        </div>
        <div className="trend-summary">
          {getTrendSummary(trends)}
        </div>
      </div>
    </div>
  );
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="tooltip-date">{label}</div>
        <div className="tooltip-content">
          <span className="tooltip-label">Feedback Count:</span>
          <span className="tooltip-value">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Helper function to generate trend summary
const getTrendSummary = (trends) => {
  if (trends.length < 2) return 'Insufficient data for trend analysis';
  
  const firstCount = trends[0].count;
  const lastCount = trends[trends.length - 1].count;
  const trend = lastCount > firstCount ? 'increasing' : lastCount < firstCount ? 'decreasing' : 'stable';
  const percentage = Math.abs(((lastCount - firstCount) / firstCount) * 100).toFixed(1);
  
  const trendIcons = {
    increasing: '↗️',
    decreasing: '↘️',
    stable: '→'
  };

  return `Trend is ${trend} ${trend !== 'stable' ? `by ${percentage}%` : ''} ${trendIcons[trend]}`;
};