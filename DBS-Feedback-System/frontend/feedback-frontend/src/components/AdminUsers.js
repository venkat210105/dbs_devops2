import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import TopNavBar from './TopNavBar';
import TrendsChart from './TrendsChart';
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer as ReResponsive } from 'recharts';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const [selected, setSelected] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', sentiment: '', topic: '' });

  const [quickInput, setQuickInput] = useState('');

  const apiBase = API_BASE;

  useEffect(() => {
    setLoading(true);
    axios.get(`${apiBase}/admin/users`)
      .then(res => setUsers(res.data || []))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [apiBase]);

  const filteredUsers = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return users;
    return users.filter(u => (
      (u.customerName || '').toLowerCase().includes(qq) ||
      (u.userName || '').toLowerCase().includes(qq) ||
      (u.email || '').toLowerCase().includes(qq)
    ));
  }, [users, q]);

  const loadFeedbacks = (user) => {
    setSelected(user);
    setFbLoading(true);
    setFbError('');
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.sentiment) params.append('sentiment', filters.sentiment);
    if (filters.topic) params.append('topic', filters.topic);
    axios.get(`${apiBase}/admin/users/${user.id}/feedbacks?${params.toString()}`)
      .then(res => setFeedbacks(res.data || []))
      .catch(() => setFbError('Failed to load feedbacks'))
      .finally(() => setFbLoading(false));
  };

  const openQuick = async () => {
    const val = quickInput.trim();
    if (!val) return;
    setFbLoading(true); setFbError('');
    try {
      // Try email first if it looks like an email
      if (val.includes('@')) {
        const res = await axios.get(`${apiBase}/admin/users/by-email`, { params: { email: val } });
        loadFeedbacks(res.data);
        return;
      }
      // Otherwise try username
      const res2 = await axios.get(`${apiBase}/admin/users/by-username`, { params: { userName: val } });
      loadFeedbacks(res2.data);
    } catch (e) {
      // As a fallback, if username failed but string contains @, try email once more; else try username
      try {
        if (!val.includes('@')) {
          const rEmail = await axios.get(`${apiBase}/admin/users/by-email`, { params: { email: val } });
          loadFeedbacks(rEmail.data);
        } else {
          const rUser = await axios.get(`${apiBase}/admin/users/by-username`, { params: { userName: val } });
          loadFeedbacks(rUser.data);
        }
      } catch {
        setFbError('No user found for that input');
        setFbLoading(false);
      }
    }
  };

  // Aggregations for charts
  const sentimentCounts = React.useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    (feedbacks || []).forEach(f => {
      const s = (f.sentimentLabel || '').toString().toLowerCase();
      if (s.includes('pos')) counts.positive += 1;
      else if (s.includes('neg')) counts.negative += 1;
      else counts.neutral += 1;
    });
    return counts;
  }, [feedbacks]);

  const pieData = React.useMemo(() => (
    Object.entries(sentimentCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase()+name.slice(1), value }))
  ), [sentimentCounts]);
  const pieTotal = React.useMemo(() => pieData.reduce((s, x) => s + (Number(x.value)||0), 0), [pieData]);

  const pieColors = ['#10b981', '#6b7280', '#ef4444'];

  const timeline = React.useMemo(() => {
    const map = new Map();
    (feedbacks || []).forEach(f => {
      const d = f.createdAt ? new Date(f.createdAt) : null;
      if (!d) return;
      const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0,10);
      map.set(key, (map.get(key) || 0) + 1);
    });
    const arr = Array.from(map.entries()).map(([date, count]) => ({ date, count }));
    arr.sort((a,b) => a.date.localeCompare(b.date));
    return arr;
  }, [feedbacks]);

  // Summary metrics
  const totalFeedbacks = feedbacks.length;
  const avgRating = React.useMemo(() => {
    if (!feedbacks.length) return 0;
    const sum = feedbacks.reduce((s, f) => s + (Number(f.rating) || 0), 0);
    return sum / feedbacks.length;
  }, [feedbacks]);
  const topTopics = React.useMemo(() => {
    const counts = new Map();
    (feedbacks || []).forEach(f => {
      const t = (f.topic || '').trim().toLowerCase();
      if (!t) return;
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a,b) => b[1]-a[1]).slice(0,3).map(([t,c]) => ({ topic: t, count: c }));
  }, [feedbacks]);

  const exportCsv = () => {
    if (!feedbacks.length) return;
    const rows = feedbacks.map(f => ({
      id: f.id,
      customerName: f.customerName || '',
      userName: f.userName || '',
      email: f.email || f.userEmail || '',
      rating: f.rating ?? '',
      sentiment: (f.sentimentLabel || '').toString().toLowerCase(),
      topic: f.topic || '',
      comment: (f.comment || f.feedback || '').replace(/\n/g, ' '),
      createdAt: f.createdAt || ''
    }));
    const header = Object.keys(rows[0]);
    const csv = [header.join(','), ...rows.map(r => header.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `user_feedback_${selected?.id || 'unknown'}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <TopNavBar title="Admin Users" icon={<PeopleOutlineIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#0b0f19' }} />} />
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Paper elevation={0} sx={{ p:2, mb:2, border: '1px solid #e5e7eb', borderRadius:2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Users</Typography>
          <Box sx={{ display:'flex', gap:1, alignItems:'center', mb:2, flexWrap:'wrap' }}>
            <TextField size="small" label="Open by email or username" value={quickInput} onChange={e=>setQuickInput(e.target.value)} />
            <Button variant="outlined" onClick={openQuick} sx={{ textTransform:'none' }}>Open</Button>
            <TextField size="small" label="Filter users (name/email)" value={q} onChange={e=>setQ(e.target.value)} />
          </Box>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={160}><CircularProgress /></Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius:2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>User Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.id}</TableCell>
                      <TableCell>{u.customerName || '-'}</TableCell>
                      <TableCell>{u.userName || '-'}</TableCell>
                      <TableCell>{u.email || '-'}</TableCell>
                      <TableCell>
                        <Button variant="outlined" size="small" onClick={()=>loadFeedbacks(u)} sx={{ textTransform:'none', borderColor:'#0b0f19', color:'#0b0f19', '&:hover':{ background:'#0b0f19', color:'#fff', borderColor:'#0b0f19' }}}>View Feedbacks</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p:2, border: '1px solid #e5e7eb', borderRadius:2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Feedbacks {selected ? `for ${selected.customerName || selected.email || selected.userName || ('#'+selected.id)}` : ''}</Typography>
          <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', mb:2 }}>
            <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={filters.from} onChange={e=>setFilters(f=>({...f, from: e.target.value}))} />
            <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={filters.to} onChange={e=>setFilters(f=>({...f, to: e.target.value}))} />
            <TextField size="small" label="Sentiment (e.g., positive)" value={filters.sentiment} onChange={e=>setFilters(f=>({...f, sentiment: e.target.value}))} />
            <TextField size="small" label="Topic contains" value={filters.topic} onChange={e=>setFilters(f=>({...f, topic: e.target.value}))} />
            <Button variant="contained" onClick={()=> selected && loadFeedbacks(selected)} sx={{ textTransform:'none', background:'#0b0f19', '&:hover':{ background:'#111827' }}}>Apply</Button>
          </Box>
          {/* Summary + Charts section */}
          <Box sx={{ display:'grid', gridTemplateColumns: { xs:'1fr', md:'1fr 1fr 1fr' }, gap:2, mb:2 }}>
            <Paper elevation={0} sx={{ p:2, border: '1px solid #e5e7eb', borderRadius:2 }}>
              <Typography variant="subtitle2" sx={{ color:'#64748b' }}>Total Feedbacks</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{totalFeedbacks}</Typography>
            </Paper>
            <Paper elevation={0} sx={{ p:2, border: '1px solid #e5e7eb', borderRadius:2 }}>
              <Typography variant="subtitle2" sx={{ color:'#64748b' }}>Average Rating</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{avgRating.toFixed(1)}</Typography>
            </Paper>
            <Paper elevation={0} sx={{ p:2, border: '1px solid #e5e7eb', borderRadius:2 }}>
              <Typography variant="subtitle2" sx={{ color:'#64748b' }}>Top Topics</Typography>
              {topTopics.length ? topTopics.map(t => (
                <Typography key={t.topic} variant="body2">{t.topic} — {t.count}</Typography>
              )) : (
                <Typography variant="body2" sx={{ color:'#6b7280' }}>No topics</Typography>
              )}
            </Paper>
          </Box>
          <Box sx={{ display:'flex', justifyContent:'flex-end', mb:2 }}>
            <Button variant="outlined" onClick={exportCsv} disabled={!feedbacks.length} sx={{ textTransform:'none', borderColor:'#0b0f19', color:'#0b0f19', '&:hover':{ background:'#0b0f19', color:'#fff', borderColor:'#0b0f19' }}}>Export CSV</Button>
          </Box>
          <Box sx={{ display:'grid', gridTemplateColumns: { xs:'1fr', md:'1fr 1fr' }, gap:2, mb:2 }}>
            <Paper elevation={0} sx={{ p:2, border: '1px solid #e5e7eb', borderRadius:2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb:1 }}>Sentiment Distribution</Typography>
              {pieTotal > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ReResponsive width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <ReTooltip />
                    </PieChart>
                  </ReResponsive>
                </div>
              ) : (
                <Typography variant="body2" sx={{ color:'#6b7280' }}>No feedback yet for this user</Typography>
              )}
            </Paper>
            <Paper elevation={0} sx={{ p:2, border: '1px solid #e5e7eb', borderRadius:2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb:1 }}>Timeline</Typography>
              <TrendsChart trends={timeline} />
            </Paper>
          </Box>
          {fbLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={140}><CircularProgress /></Box>
          ) : fbError ? (
            <Alert severity="error">{fbError}</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius:2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Summary</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Sentiment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Topic</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedbacks.map(fb => (
                    <TableRow key={fb.id}>
                      <TableCell>{fb.id}</TableCell>
                      <TableCell>{fb.comment || fb.feedback || '-'}</TableCell>
                      <TableCell>{(fb.sentimentLabel || '').toString().toLowerCase()}</TableCell>
                      <TableCell>{fb.topic || '-'}</TableCell>
                      <TableCell>{fb.createdAt || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminUsers;
