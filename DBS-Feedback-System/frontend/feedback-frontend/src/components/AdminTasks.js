import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

function PriorityBadge({ value }) {
  const color = value === 'CRITICAL' ? '#dc2626' : value === 'HIGH' ? '#b45309' : value === 'MEDIUM' ? '#2563eb' : '#059669';
  const bg = value === 'CRITICAL' ? '#fee2e2' : value === 'HIGH' ? '#fef3c7' : value === 'MEDIUM' ? '#dbeafe' : '#d1fae5';
  return (
    <span style={{ background:bg, color, padding:'2px 8px', borderRadius:999, fontSize:12, fontWeight:700 }}>{value}</span>
  );
}

export default function AdminTasks() {
  const [tab, setTab] = useState('TODO');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (status = tab) => {
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API_BASE}/admin/tasks`, { params: { status }});
      setTasks(res.data || []);
    } catch (e) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load('TODO'); }, []);

  const onTabChange = async (_e, value) => {
    setTab(value);
    await load(value);
  };

  const generateTasks = async () => {
    try {
      setBusy(true);
      await axios.post(`${API_BASE}/admin/tasks/generate`, null, { params: { onlyNegative: false } });
      await load('TODO');
      setTab('TODO');
    } catch (e) {
      setError('Failed to generate tasks');
    } finally {
      setBusy(false);
    }
  };

  const markDone = async (taskId) => {
    try {
      setBusy(true);
      await axios.post(`${API_BASE}/admin/tasks/${taskId}/done`, {});
      await load(tab);
    } catch (e) {
      setError('Failed to mark task done');
    } finally {
      setBusy(false);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      if (!window.confirm('Delete this task? This cannot be undone.')) return;
      setBusy(true);
      await axios.delete(`${API_BASE}/admin/tasks/${taskId}`);
      await load(tab);
    } catch (e) {
      setError('Failed to delete task');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ p:2, mb:4, borderRadius:2, border:'1px solid #e5e7eb' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Admin To-Do</Typography>
        <Button onClick={generateTasks} disabled={busy} variant="contained" sx={{ textTransform:'none', background:'#0b0f19', '&:hover':{ background:'#111827' }}}>
          {busy ? 'Working…' : 'Generate Tasks'}
        </Button>
      </Box>

      <Tabs value={tab} onChange={onTabChange} sx={{ borderBottom:'1px solid #e5e7eb' }}>
        <Tab value="TODO" label="To-Do" />
        <Tab value="DONE" label="Solved" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={160}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt:2 }}>{error}</Alert>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ mt:2, border:'1px solid #e5e7eb', borderRadius:2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background:'#f8fafc' }}>
                <TableCell sx={{ fontWeight:700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight:700 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight:700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight:700 }}>Feedback ID</TableCell>
                <TableCell sx={{ fontWeight:700 }}>Assignee</TableCell>
                <TableCell sx={{ fontWeight:700 }}>Created</TableCell>
                <TableCell sx={{ fontWeight:700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map(t => (
                <TableRow key={t.id} hover>
                  <TableCell>#{t.id}</TableCell>
                  <TableCell><PriorityBadge value={t.priority || 'MEDIUM'} /></TableCell>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.feedback?.id || '-'}</TableCell>
                  <TableCell>{t.assignedTo || '-'}</TableCell>
                  <TableCell>{t.createdAt || '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {tab === 'TODO' && (
                        <Button size="small" variant="outlined" disabled={busy} onClick={() => markDone(t.id)} sx={{ textTransform:'none' }}>
                          Mark done
                        </Button>
                      )}
                      <Button size="small" color="error" variant="outlined" disabled={busy} onClick={() => deleteTask(t.id)} sx={{ textTransform:'none' }}>
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color:'#6b7280' }}>No tasks</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
