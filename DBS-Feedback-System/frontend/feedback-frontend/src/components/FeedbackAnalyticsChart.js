import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

function FeedbackAnalyticsChart() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    axios.get('/admin/analytics')
      .then(res => setAnalytics(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!analytics) return <div>Loading analytics...</div>;

  const data = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        label: 'Feedback Sentiment',
        data: [analytics.positive, analytics.negative, analytics.neutral],
        backgroundColor: [
          'rgba(0,0,0,0.05)',
          'rgba(0,0,0,0.05)',
          'rgba(0,0,0,0.05)'
        ],
        borderColor: [
          'rgba(0,0,0,1)',
          'rgba(0,0,0,1)',
          'rgba(80,80,80,1)'
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <h3 style={{ fontWeight: 400, color: '#222', marginBottom: 16 }}>Feedback Sentiment Analytics</h3>
      <Pie data={data} options={{ plugins: { legend: { labels: { color: '#222' } } } }} />
      <div style={{ marginTop: '1rem', color: '#222' }}>
        <b>Total Feedbacks:</b> {analytics.total}
      </div>
    </div>
  );
}

export default FeedbackAnalyticsChart;
