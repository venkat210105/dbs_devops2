import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

export default function AdminImplicitAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [since, setSince] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('success');
  const fileInputId = 'implicit-upload-input';

  const load = async (mins = since) => {
    setLoading(true); setError('');
    try {
      const [a, b] = await Promise.all([
        axios.get(`${API_BASE}/admin/implicit/analytics`, { params: { sinceMinutes: mins } }),
        axios.get(`${API_BASE}/admin/implicit/alerts`, { params: { limit: 20 } })
      ]);
      setAnalytics(a.data);
      setAlerts(b.data || []);
    } catch (e) {
      setError('Failed to load implicit analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(60); }, []);

  const uploadCsv = async () => {
    if (!file) return;
    setBusy(true); setUploadError(''); setUploadResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      // Do not set Content-Type manually; let the browser set the multipart boundary
      const res = await axios.post(`${API_BASE}/admin/implicit/upload`, form);
      const data = res?.data;
      setUploadResult(data);
      const processed = typeof data === 'object' && data ? (data.processed ?? 0) : 0;
      const createdCount = typeof data === 'object' && data && Array.isArray(data.created) ? data.created.length : 0;
      const createdTitles = (Array.isArray(data?.created) ? data.created : []).slice(0, 3)
        .map(x => x?.task?.title || x?.title)
        .filter(Boolean);
      const msg = `Imported ${processed} session${processed===1?'':'s'} — created ${createdCount} task${createdCount===1?'':'s'}`;
      setSnackMsg(createdTitles.length > 0 ? `${msg}. Top: ${createdTitles.join(' • ')}` : msg);
      setSnackSeverity('success');
      setSnackOpen(true);
      // Reset file input for subsequent uploads
      setFile(null);
      const inputEl = document.getElementById(fileInputId);
      if (inputEl) inputEl.value = '';
      // Reload analytics after upload
      load(since);
    } catch (e) {
      const err = e?.response?.data?.error || e?.response?.data?.message || e.message || 'Upload failed';
      setUploadError(err);
      setSnackMsg(err);
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const handleSnackClose = (_e, reason) => {
    if (reason === 'clickaway') return;
    setSnackOpen(false);
  };

  return (
    <Paper id="implicit-analytics-section" elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <InsightsOutlinedIcon sx={{ color: '#0b0f19' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Implicit Analytics</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <select value={since} onChange={e => { const v = Number(e.target.value); setSince(v); load(v); }} style={{border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 10px'}}>
            <option value={30}>Last 30 mins</option>
            <option value={60}>Last 60 mins</option>
            <option value={240}>Last 4 hours</option>
            <option value={1440}>Last 24 hours</option>
          </select>
          <label>
            <input id={fileInputId} type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display:'none' }} />
            <Button component="span" variant="outlined" startIcon={<UploadFileOutlinedIcon />} sx={{ textTransform:'none', borderColor:'#0b0f19', color:'#0b0f19', '&:hover':{ background:'#0b0f19', color:'#fff', borderColor:'#0b0f19' }}}>Choose CSV</Button>
          </label>
          <Button onClick={uploadCsv} disabled={!file || busy} variant="contained" sx={{ textTransform:'none', background:'#0b0f19', '&:hover':{ background:'#111827' }}}>{busy ? 'Uploading…' : 'Upload & Import'}</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
      {/* Inline alerts removed in favor of themed snackbars */}

      <Snackbar
        open={snackOpen}
        autoHideDuration={4500}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snackSeverity}
          variant="filled"
          sx={{
            bgcolor: snackSeverity === 'success' ? '#0b0f19' : '#b91c1c',
            color: '#fff',
            '& .MuiAlert-icon': { color: '#fff' },
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
          }}
          action={
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackMsg}
        </Alert>
      </Snackbar>

      {!analytics && loading ? (
        <Typography variant="body2">Loading…</Typography>
      ) : analytics && (
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>p95/p99 by page</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Path</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }} align="right">Count</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }} align="right">p95 (ms)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }} align="right">p99 (ms)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(analytics.perPath || []).map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.path}</TableCell>
                    <TableCell align="right">{row.count}</TableCell>
                    <TableCell align="right">{row.p95}</TableCell>
                    <TableCell align="right">{row.p99}</TableCell>
                  </TableRow>
                ))}
                {(!analytics.perPath || analytics.perPath.length === 0) && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ color:'#6b7280' }}>No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <WarningAmberOutlinedIcon sx={{ color:'#0b0f19' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent anomaly alerts</Typography>
          </Box>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0b0f19' }}>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.title}</TableCell>
                    <TableCell>{a.priority}</TableCell>
                    <TableCell>{a.status}</TableCell>
                    <TableCell>{a.createdAt || '-'}</TableCell>
                  </TableRow>
                ))}
                {alerts.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ color:'#6b7280' }}>No alerts</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
}
