import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#f59e0b',
  MEDIUM: '#3b82f6',
  LOW: '#10b981',
  UNKNOWN: '#6b7280'
};

export default function UrgencyPieChart({ urgencyCounts }) {
  if (!urgencyCounts || typeof urgencyCounts !== 'object') {
    return <div>No urgency data available</div>;
  }

  const entries = Object.entries(urgencyCounts);
  const data = entries.map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
    raw: key.toUpperCase(),
    value: typeof value === 'number' ? value : Number(value || 0)
  })).filter(d => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ margin: 0 }}>Feedback Urgency</h3>
        <span style={{ color: '#6b7280', fontSize: 12 }}>Total: {total}</span>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.raw] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip formatter={(v, n, p) => [v, p && p.payload ? p.payload.name : n]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
