import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = { SOLVED: '#10b981', UNSOLVED: '#ef4444' };

export default function ResolutionPieChart({ taskStatusCounts }) {
  const done = (taskStatusCounts && taskStatusCounts.DONE) ? taskStatusCounts.DONE : 0;
  const todo = (taskStatusCounts && taskStatusCounts.TODO) ? taskStatusCounts.TODO : 0;

  const data = [
    { name: 'Solved', raw: 'SOLVED', value: done },
    { name: 'Unsolved', raw: 'UNSOLVED', value: todo }
  ].filter(d => d.value > 0);

  const total = done + todo;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ margin: 0 }}>Queries Solved vs Unsolved</h3>
        <span style={{ color: '#6b7280', fontSize: 12 }}>Total: {total}</span>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
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
