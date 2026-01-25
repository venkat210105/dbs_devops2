import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

function FeedbackAnalyticsChart() {
  const [analytics, setAnalytics] = useState(null);
  const [tasksStats, setTasksStats] = useState(null);
  const [urgency, setUrgency] = useState({ CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 });

  useEffect(() => {
  const base = API_BASE;
  axios.get(`${base}/admin/analytics`)
      .then(res => setAnalytics(res.data))
      .catch(async (err) => {
        console.error('Analytics API failed, attempting client-side aggregation:', err);
        // Fallback: fetch /feedback/all and compute counts client-side
        try {
          const resAll = await axios.get(`${base}/feedback/all`);
          const list = resAll.data || [];
          const counts = { positive: 0, negative: 0, neutral: 0 };
          list.forEach(f => {
            const s = (f.sentiment || f.sentimentLabel || f.label || 'neutral').toString().toLowerCase();
            if (s === 'positive') counts.positive++; else if (s === 'negative') counts.negative++; else counts.neutral++;
          });
          setAnalytics({ total: list.length, ...counts });
        } catch (e) {
          console.error('Fallback analytics failed:', e);
          setAnalytics({ total: 0, positive: 0, negative: 0, neutral: 0 });
        }
      });

  // Load tasks solved vs unsolved in parallel
  const loadTasks = async () => {
    try {
      const [todoRes, doneRes] = await Promise.all([
        axios.get(`${base}/admin/tasks`, { params: { status: 'TODO' } }),
        axios.get(`${base}/admin/tasks`, { params: { status: 'DONE' } }),
      ]);
      const todo = Array.isArray(todoRes.data) ? todoRes.data.length : 0;
      const done = Array.isArray(doneRes.data) ? doneRes.data.length : 0;
      setTasksStats({ todo, done, total: todo + done });

      // Compute urgency from TODO tasks
      const list = Array.isArray(todoRes.data) ? todoRes.data : [];
      const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
      for (const t of list) {
        const p = (t.priority || 'UNKNOWN').toString().toUpperCase();
        if (counts[p] == null) counts.UNKNOWN += 1; else counts[p] += 1;
      }
      setUrgency(counts);
    } catch (e) {
      console.error('Failed to load tasks stats:', e);
      setTasksStats({ todo: 0, done: 0, total: 0 });
      setUrgency({ CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 });
    }
  };
  loadTasks();
  }, []);

  if (!analytics || !tasksStats) return <div>Loading analytics...</div>;

  const sentimentData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        label: 'Feedback Sentiment',
        data: [analytics.positive, analytics.negative, analytics.neutral],
        backgroundColor: [
          '#10b981', // positive - emerald
          '#ef4444', // negative - red
          '#6b7280'  // neutral - gray
        ],
        borderColor: [
          '#0f766e',
          '#b91c1c',
          '#374151'
        ],
        borderWidth: 1,
      },
    ],
  };

  const tasksData = {
    labels: ['Solved', 'Unsolved'],
    datasets: [
      {
        label: 'Queries Resolution',
        data: [tasksStats.done, tasksStats.todo],
        backgroundColor: [
          '#10b981', // solved - green
          '#ef4444', // unsolved - red
        ],
        borderColor: [
          '#0f766e',
          '#b91c1c',
        ],
        borderWidth: 1,
      },
    ],
  };

  const urgencyData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Urgency (Open Tasks)',
        data: [urgency.CRITICAL, urgency.HIGH, urgency.MEDIUM, urgency.LOW],
        backgroundColor: [
          '#dc2626', // critical - red
          '#f59e0b', // high - amber
          '#3b82f6', // medium - blue
          '#10b981', // low - green
        ],
        borderColor: [
          '#b91c1c',
          '#d97706',
          '#2563eb',
          '#047857',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', margin: '1rem 0' }}>
      <div style={{ width: 360, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16 }}>
        <h3 style={{ fontWeight: 600, color: '#0b0f19', marginBottom: 12 }}>Feedback Sentiment</h3>
        <Pie
          data={sentimentData}
          options={{
            plugins: {
              legend: { position: 'bottom', labels: { color: '#0b0f19' } },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${ctx.raw} (${analytics.total ? Math.round((ctx.raw/analytics.total)*100) : 0}%)`
                }
              }
            }
          }}
        />
        <div style={{ marginTop: 12, color: '#475569' }}>
          <b>Total:</b> {analytics.total}
        </div>
      </div>

      <div style={{ width: 360, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16 }}>
        <h3 style={{ fontWeight: 600, color: '#0b0f19', marginBottom: 12 }}>Queries Solved vs Unsolved</h3>
        <Pie
          data={tasksData}
          options={{
            plugins: {
              legend: { position: 'bottom', labels: { color: '#0b0f19' } },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${ctx.raw} (${tasksStats.total ? Math.round((ctx.raw/tasksStats.total)*100) : 0}%)`
                }
              }
            }
          }}
        />
        <div style={{ marginTop: 12, color: '#475569' }}>
          <b>Total:</b> {tasksStats.total}
          <span style={{ marginLeft: 8, color: '#6b7280' }}>
            (Solved: {tasksStats.done}, Unsolved: {tasksStats.todo})
          </span>
        </div>
      </div>

      <div style={{ width: 360, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16 }}>
        <h3 style={{ fontWeight: 600, color: '#0b0f19', marginBottom: 12 }}>Urgency (Open Tasks)</h3>
        <Pie
          data={urgencyData}
          options={{
            plugins: {
              legend: { position: 'bottom', labels: { color: '#0b0f19' } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const sum = urgency.CRITICAL + urgency.HIGH + urgency.MEDIUM + urgency.LOW;
                    return `${ctx.label}: ${ctx.raw} (${sum ? Math.round((ctx.raw/sum)*100) : 0}%)`;
                  }
                }
              }
            }
          }}
        />
        <div style={{ marginTop: 12, color: '#475569' }}>
          <b>Total Open:</b> {urgency.CRITICAL + urgency.HIGH + urgency.MEDIUM + urgency.LOW}
        </div>
      </div>
    </div>
  );
}

export default FeedbackAnalyticsChart;
