import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import FeedbackAnalyticsChart from './FeedbackAnalyticsChart';
import SentimentPieChart from './SentimentPieChart';
import UrgencyPieChart from './UrgencyPieChart';
import ResolutionPieChart from './ResolutionPieChart';
import AdminTasks from './AdminTasks';
import AdminImplicitAnalytics from './AdminImplicitAnalytics';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import TopNavBar from './TopNavBar';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

function AdminDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [topic, setTopic] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [chatbotHealthy, setChatbotHealthy] = useState(null);
  const [urgencyCounts, setUrgencyCounts] = useState(null);

  const apiBase = API_BASE;
  useEffect(() => {
    axios.get(`${apiBase}/admin/feedbacks`)
      .then(res => {
        // Normalize fields to handle variations from backend/entities
        const normalized = (res.data || []).map(item => {
          const sentimentRaw = item.sentiment || item.sentimentLabel || item.label || '';
          return {
            ...item,
            customerName: item.customerName || item.name || item.fullName || '',
            email: item.email || item.customerEmail || '',
            // Prefer concise summary in comment; fall back to full feedback text
            comment: item.comment || item.feedback || '',
            feedback: item.feedback || item.comment || '',
            sentiment: (typeof sentimentRaw === 'string' ? sentimentRaw : String(sentimentRaw)).toLowerCase(),
            rating: item.rating != null ? Number(item.rating) : (item.score != null ? Number(item.score) : undefined),
            topic: item.topic || item.issue || item.reason || '',
            createdAt: item.createdAt || item.timestamp || item.date || item.created_date || ''
          };
        });
        setFeedbacks(normalized);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load feedbacks');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Frontend runs in browser; default host mapping typically exposes chatbot on 4000
    const url = process.env.REACT_APP_CHATBOT_URL || 'http://localhost:4000';
    axios.get(`${url}/health`).then(() => setChatbotHealthy(true)).catch(() => setChatbotHealthy(false));
  }, []);

  // Load open tasks and compute urgency distribution by priority
  useEffect(() => {
    const loadUrgency = async () => {
      try {
        const res = await axios.get(`${apiBase}/admin/tasks`, { params: { status: 'TODO' } });
        const tasks = Array.isArray(res.data) ? res.data : [];
        const counts = tasks.reduce((acc, t) => {
          const key = ((t.priority || 'UNKNOWN') + '').toUpperCase();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        setUrgencyCounts(counts);
      } catch (e) {
        setUrgencyCounts({});
      }
    };
    loadUrgency();
  }, [apiBase]);

  const filtered = useMemo(() => {
    return feedbacks.filter(f => {
      const text = `${f.customerName || ''} ${f.email || ''} ${f.comment || ''} ${f.feedback || ''}`.toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;
      if (sentiment && (f.sentiment || '').toLowerCase() !== sentiment.toLowerCase()) return false;
      if (topic && (f.topic || '').toLowerCase().indexOf(topic.toLowerCase()) === -1) return false;
      if (dateFrom && new Date(f.createdAt || f.timestamp || 0) < new Date(dateFrom)) return false;
      if (dateTo && new Date(f.createdAt || f.timestamp || 0) > new Date(dateTo)) return false;
      return true;
    });
  }, [feedbacks, search, sentiment, topic, dateFrom, dateTo]);

  const exportCsv = () => {
    const rows = filtered.map(f => ({
      id: f.id,
      customerName: f.customerName,
      email: f.email,
      rating: f.rating,
      sentiment: f.sentiment,
      topic: f.topic,
      comment: (f.comment || '').replace(/\n/g, ' ')
    }));
    const header = Object.keys(rows[0] || { id:'', customerName:'', email:'', rating:'', sentiment:'', topic:'', comment:'' });
    const csv = [header.join(','), ...rows.map(r => header.map(k => `"${(r[k] ?? '').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `feedback_export_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const viewDetails = (id) => {
    setDetailsLoading(true);
    setDetailsError('');
  axios.get(`${apiBase}/admin/feedback/${id}`)
      .then(res => setSelectedFeedback(res.data))
      .catch(() => setDetailsError('Failed to load feedback details'))
      .finally(() => setDetailsLoading(false));
  };

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <TopNavBar title="DBS Admin Dashboard" icon={<BarChartOutlinedIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#0b0f19' }} />} />
      <Box sx={{ position:'sticky', top:0, zIndex: 1, background:'#f8fafc' }}>
        <Box sx={{ display:'flex', justifyContent:'flex-end', gap:1, py:1 }}>
          <Button variant="outlined" size="small" href="#implicit-analytics-section" sx={{ textTransform:'none', borderColor:'#0b0f19', color:'#0b0f19', '&:hover':{ background:'#0b0f19', color:'#fff', borderColor:'#0b0f19' }}}>
            Go to Implicit Analytics
          </Button>
        </Box>
      </Box>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Chatbot health widget and filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'stretch' }}>
          <Paper elevation={0} sx={{ p:2, borderRadius:2, border:'1px solid #e5e7eb', minWidth: 260, display:'flex', alignItems:'center', gap:1 }}>
            <HealthAndSafetyOutlinedIcon sx={{ color: '#0b0f19' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Chatbot Service</Typography>
              <Typography variant="body2" sx={{ color: chatbotHealthy ? 'green' : (chatbotHealthy===false ? 'red' : '#6b7280') }}>
                {chatbotHealthy === null ? 'Checking…' : chatbotHealthy ? 'Healthy' : 'Unreachable'}
              </Typography>
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ p:2, borderRadius:2, border:'1px solid #e5e7eb', flex:1 }}>
            <Box sx={{ display:'flex', gap:1, alignItems:'center', flexWrap:'wrap' }}>
              <SearchOutlinedIcon sx={{ color:'#0b0f19' }} />
              <input placeholder="Search name/email/text" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1, border:'1px solid #e5e7eb', borderRadius:6, padding:'8px 10px'}} />
              <select value={sentiment} onChange={e=>setSentiment(e.target.value)} style={{border:'1px solid #e5e7eb', borderRadius:6, padding:'8px 10px'}}>
                <option value="">All sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
              <input placeholder="Topic" value={topic} onChange={e=>setTopic(e.target.value)} style={{border:'1px solid #e5e7eb', borderRadius:6, padding:'8px 10px'}} />
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{border:'1px solid #e5e7eb', borderRadius:6, padding:'8px 10px'}} />
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{border:'1px solid #e5e7eb', borderRadius:6, padding:'8px 10px'}} />
              <Button onClick={exportCsv} variant="outlined" startIcon={<DownloadOutlinedIcon />} sx={{ textTransform:'none', borderColor:'#0b0f19', color:'#0b0f19', '&:hover':{ background:'#0b0f19', color:'#fff', borderColor:'#0b0f19' } }}>Export CSV</Button>
            </Box>
          </Paper>
        </Box>
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <BarChartOutlinedIcon sx={{ color: '#0b0f19', mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Feedback Analytics</Typography>
          </Box>
          <Box sx={{ p: 1 }}>
            <FeedbackAnalyticsChart />
          </Box>
          <Box sx={{ p: 1 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap: 16 }}>
              <div style={{ flex: '1 1 320px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16, border: '1px solid #e5e7eb' }}>
                <SentimentPieChart sentimentCounts={{ POSITIVE: filtered.filter(f=>f.sentiment==='positive').length, NEGATIVE: filtered.filter(f=>f.sentiment==='negative').length, NEUTRAL: filtered.filter(f=>f.sentiment==='neutral').length }} />
              </div>
              <div style={{ flex: '1 1 320px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16, border: '1px solid #e5e7eb' }}>
                <UrgencyPieChart urgencyCounts={urgencyCounts} />
              </div>
              <div style={{ flex: '1 1 320px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16, border: '1px solid #e5e7eb' }}>
                <ResolutionPieChart />
              </div>
            </div>
          </Box>
        </Paper>

        <AdminImplicitAnalytics />

        <AdminTasks />

        <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 2, border: '1px solid #e5e7eb' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <TableRowsOutlinedIcon sx={{ color: '#0b0f19', mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>All Feedbacks</Typography>
          </Box>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={200}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Summary</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Sentiment</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Topic</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map(fb => (
                    <TableRow key={fb.id} hover sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                      <TableCell>{fb.id}</TableCell>
                      <TableCell>{fb.customerName}</TableCell>
                      <TableCell>{fb.email}</TableCell>
                      <TableCell>{fb.comment}</TableCell>
                      <TableCell>{fb.sentiment || '-'}</TableCell>
                      <TableCell>{fb.topic || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => viewDetails(fb.id)}
                          sx={{
                            textTransform: 'none',
                            borderColor: '#0b0f19',
                            color: '#0b0f19',
                            '&:hover': { backgroundColor: '#0b0f19', color: 'white', borderColor: '#0b0f19' }
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Dialog open={!!selectedFeedback || detailsLoading || !!detailsError} onClose={() => { setSelectedFeedback(null); setDetailsError(''); }} maxWidth="sm" fullWidth>
          <DialogTitle>Feedback Details</DialogTitle>
          <DialogContent dividers>
            {detailsLoading && (
              <Box display="flex" justifyContent="center" alignItems="center" height={160}><CircularProgress /></Box>
            )}
            {!detailsLoading && detailsError && (
              <Alert severity="error">{detailsError}</Alert>
            )}
            {!detailsLoading && !detailsError && selectedFeedback && (
              <Box sx={{ display:'grid', gridTemplateColumns:'140px 1fr', rowGap:1.2 }}>
                <Typography variant="body2" sx={{ color:'#64748b' }}>ID</Typography><Typography variant="body2">#{selectedFeedback.id}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Customer</Typography><Typography variant="body2">{selectedFeedback.customerName || 'Anonymous'}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Email</Typography><Typography variant="body2">{selectedFeedback.email || '-'}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Rating</Typography><Typography variant="body2">{selectedFeedback.rating ?? '-'}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Sentiment</Typography><Typography variant="body2">{(selectedFeedback.sentiment||'').toString().toLowerCase() || '-'}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Topic</Typography><Typography variant="body2">{selectedFeedback.topic || '-'}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Summary</Typography><Typography variant="body2">{selectedFeedback.comment || '-'}</Typography>
                {selectedFeedback.feedback && (
                  <><Typography variant="body2" sx={{ color:'#64748b' }}>Details</Typography><Typography variant="body2">{selectedFeedback.feedback}</Typography></>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setSelectedFeedback(null); setDetailsError(''); }} sx={{ textTransform:'none' }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default AdminDashboard;
