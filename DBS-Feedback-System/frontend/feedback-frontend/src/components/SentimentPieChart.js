import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = { POSITIVE: '#10b981', NEGATIVE: '#ef4444', NEUTRAL: '#6b7280', UNKNOWN: '#8884d8' };

export default function SentimentPieChart({ sentimentCounts }) {
  if (!sentimentCounts || typeof sentimentCounts !== 'object') {
    return <div>No sentiment data available</div>;
  }
  const data = Object.entries(sentimentCounts).map(([k, v]) => ({
    name: k.charAt(0) + k.slice(1).toLowerCase(),
    raw: k.toUpperCase(),
    value: typeof v === 'number' ? v : Number(v || 0)
  })).filter(d => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
        <h3 style={{ margin: 0 }}>Sentiment Distribution</h3>
        <span style={{ color:'#6b7280', fontSize:12 }}>Total: {total}</span>
      </div>
      <div style={{ width:'100%', height:300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name, value}) => `${name}: ${value}`}>
              {data.map((e, i) => (
                <Cell key={i} fill={COLORS[e.raw] || '#8884d8'} />
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
