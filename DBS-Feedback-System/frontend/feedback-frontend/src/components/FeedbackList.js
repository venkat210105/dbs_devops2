import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./FeedbackList.css";
import { Icon, IconSmile, IconFrown, IconMeh, IconChat, IconRefresh, IconClipboard } from "./icons/OutlineIcons.jsx";
// MUI components for unified design with AdminDashboard
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
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import TopNavBar from './TopNavBar';
import { API_BASE } from '../utils/apiBase';

const FeedbackList = ({ refreshTrigger }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:8085';
      const res = await axios.get(`${API_BASE}/feedback/all`);
      const mapped = (res.data || []).map(f => {
        const sentiment = (f.sentiment || f.sentimentLabel || f.label || '').toString();
        const comment = f.comment || f.feedback || '';
        const customerName = f.customerName || f.userName || 'Anonymous';
        const userEmail = f.userEmail || f.email || '';
        const rating = typeof f.rating === 'number' ? f.rating : (parseInt(f.rating, 10) || 0);
        // Normalize createdAt to ISO string if necessary
        let createdAt = f.createdAt || f.timestamp || f.date || f.created_date;
        try {
          if (createdAt && typeof createdAt === 'object') {
            // Handle possible { time: epochMs } or { seconds: s, nanos: ns }
            if (typeof createdAt.time === 'number') {
              createdAt = new Date(createdAt.time).toISOString();
            } else if (typeof createdAt.seconds === 'number') {
              createdAt = new Date(createdAt.seconds * 1000).toISOString();
            }
          }
        } catch {}
        return { ...f, sentiment, comment, customerName, userEmail, rating, createdAt };
      });
      setFeedbacks(mapped);
      setError(null);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError('Failed to load feedback list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback, refreshTrigger]);

  const toggleExpand = (id) => {
    setExpandedFeedback(expandedFeedback === id ? null : id);
  };

  const getSentimentIcon = (sentiment) => {
    if (!sentiment) return <Icon><IconClipboard /></Icon>;
    switch (sentiment.toLowerCase()) {
      case 'positive': return <Icon><IconSmile /></Icon>;
      case 'negative': return <Icon><IconFrown /></Icon>;
      case 'neutral': return <Icon><IconMeh /></Icon>;
      default: return <Icon><IconChat /></Icon>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filtered = React.useMemo(() => {
    let list = feedbacks;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(f => (`${f.customerName||''} ${f.userEmail||f.email||''} ${f.comment||''} ${f.feedback||''}`.toLowerCase().includes(s)));
    }
    if (sentiment) {
      list = list.filter(f => (f.sentiment||'').toString().toLowerCase() === sentiment.toLowerCase());
    }
    return list;
  }, [feedbacks, search, sentiment]);

  const paged = React.useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const onChangePage = (e, p) => setPage(p);
  const onChangeRows = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  const exportCsv = () => {
    const rows = filtered.map(f => ({
      id: f.id,
      customerName: f.customerName || 'Anonymous',
      email: f.userEmail || f.email || '',
      rating: f.rating,
      sentiment: (f.sentiment||'').toString().toLowerCase(),
      topic: f.topic || '',
      comment: (f.comment || '').replace(/\n/g, ' ')
    }));
    const header = Object.keys(rows[0] || { id:'', customerName:'', email:'', rating:'', sentiment:'', topic:'', comment:'' });
    const csv = [header.join(','), ...rows.map(r => header.map(k => `"${(r[k]??'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `feedback_list_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const TopBar = (<TopNavBar title="Feedback List" icon={<TableRowsOutlinedIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#0b0f19' }} />} />);

  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        {TopBar}
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <div className="feedback-list-header">
            <div className="header-content">
              <h2>All Feedback</h2>
              <span className="feedback-count">Loading…</span>
            </div>
            <button onClick={fetchFeedback} className="refresh-btn">
              <Icon className="mr-1" style={{ marginRight: 6 }}><IconRefresh /></Icon> Refresh
            </button>
          </div>
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {TopBar}
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <div className="feedback-list-header">
          <div className="header-content">
            <h2>All Feedback</h2>
            <span className="feedback-count">{filtered.length} entries</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCsv} className="refresh-btn">
              Export CSV
            </button>
            <button onClick={fetchFeedback} className="refresh-btn">
              <Icon className="mr-1" style={{ marginRight: 6 }}><IconRefresh /></Icon> Refresh
            </button>
          </div>
        </div>

        <Box sx={{ p:2, borderRadius:2, border:'1px solid #e5e7eb', background:'#fff', mb:3, display:'flex', gap:1, alignItems:'center', flexWrap:'wrap' }}>
          <TextField size="small" label="Search name/email/text" value={search} onChange={(e)=>{setSearch(e.target.value); setPage(0);}} sx={{ minWidth: 260 }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="sentiment-label">Sentiment</InputLabel>
            <Select labelId="sentiment-label" label="Sentiment" value={sentiment} onChange={(e)=>{setSentiment(e.target.value); setPage(0);}}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="positive">Positive</MenuItem>
              <MenuItem value="neutral">Neutral</MenuItem>
              <MenuItem value="negative">Negative</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : feedbacks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon><IconChat /></Icon></div>
            <h3>No Feedback Yet</h3>
            <p>Be the first to share your thoughts!</p>
          </div>
        ) : (
          <>
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
                    <TableCell sx={{ width: 100 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((fb) => {
                    const summary = (fb.comment || '').toString();
                    const truncated = summary.length > 140 ? summary.slice(0, 140) + '…' : summary;
                    const sent = (fb.sentiment || '').toString().toLowerCase();
                    return (
                      <TableRow key={fb.id} hover sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                        <TableCell>#{fb.id}</TableCell>
                        <TableCell>{fb.customerName || 'Anonymous'}</TableCell>
                        <TableCell>{fb.userEmail || fb.email || '-'}</TableCell>
                        <TableCell>
                          <Tooltip title={summary} placement="top-start">
                            <span>{truncated}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {sent ? (
                            <Chip label={sent} variant="outlined" sx={{ textTransform:'capitalize', color:'#0b0f19', borderColor:'#e5e7eb' }} />
                          ) : (
                            '-' 
                          )}
                        </TableCell>
                        <TableCell>{fb.topic || '-'}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={() => setSelected(fb)} sx={{ textTransform:'none', borderColor:'#0b0f19', color:'#0b0f19', '&:hover':{ background:'#0b0f19', color:'#fff', borderColor:'#0b0f19' } }}>View</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={onChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={onChangeRows}
              rowsPerPageOptions={[5,10,25,50]}
            />
          </>
        )}

        <Dialog open={!!selected} onClose={()=>setSelected(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Feedback Details</DialogTitle>
          <DialogContent dividers>
            {selected && (
              <Box sx={{ display:'grid', gridTemplateColumns:'140px 1fr', rowGap:1.2 }}>
                <Typography variant="body2" sx={{ color:'#64748b' }}>ID</Typography><Typography variant="body2">#{selected.id}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Customer</Typography><Typography variant="body2">{selected.customerName || 'Anonymous'}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Email</Typography><Typography variant="body2">{selected.userEmail || selected.email || '-'}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Rating</Typography><Typography variant="body2">{selected.rating}/5</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Sentiment</Typography><Typography variant="body2">{(selected.sentiment||'').toString().toLowerCase() || '-'}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Topic</Typography><Typography variant="body2">{selected.topic || '-'}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Submitted</Typography><Typography variant="body2">{formatDate(selected.createdAt)}</Typography>
                <Typography variant="body2" sx={{ color:'#64748b' }}>Summary</Typography><Typography variant="body2">{selected.comment}</Typography>
                {selected.feedback && (
                  <><Typography variant="body2" sx={{ color:'#64748b' }}>Details</Typography><Typography variant="body2">{selected.feedback}</Typography></>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={()=>setSelected(null)} sx={{ textTransform:'none' }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default FeedbackList;