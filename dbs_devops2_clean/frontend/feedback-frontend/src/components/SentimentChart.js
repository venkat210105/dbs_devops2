import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './SentimentChart.css';

export default function SentimentChart({ sentimentCounts }) {
  if (!sentimentCounts || typeof sentimentCounts !== 'object') {
    return (
      <div className="sentiment-chart-container">
        <div className="chart-header">
          <h3>Sentiment Analysis</h3>
        </div>
        <div className="no-data-state">
          <div className="no-data-icon">📊</div>
          <p>No sentiment data available</p>
        </div>
      </div>
    );
  }
  
  const data = Object.entries(sentimentCounts).map(([label, count]) => ({ 
    label: label.charAt(0).toUpperCase() + label.slice(1), 
    count 
  }));

  const getSentimentColor = (label) => {
    switch (label.toLowerCase()) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#8884d8';
    }
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="sentiment-chart-container">
      <div className="chart-header">
        <h3>Sentiment Analysis</h3>
        <div className="chart-stats">
          <span className="total-feedback">Total: {total} feedback entries</span>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <XAxis 
              dataKey="label" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [`${value} entries`, 'Count']}
              labelFormatter={(label) => `Sentiment: ${label}`}
            />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]}
              barSize={60}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getSentimentColor(entry.label)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        {data.map((item, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: getSentimentColor(item.label) }}
            ></div>
            <span className="legend-label">{item.label}</span>
            <span className="legend-count">{item.count}</span>
            <span className="legend-percentage">
              ({((item.count / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}