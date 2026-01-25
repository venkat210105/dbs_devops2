import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/apiBase';
import TopNavBar from './TopNavBar';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

function Section({ title, children, action }) {
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

function PriorityBadge({ value }) {
  const color = value === 'CRITICAL' ? '#dc2626' : value === 'HIGH' ? '#b45309' : value === 'MEDIUM' ? '#2563eb' : '#059669';
  const bg = value === 'CRITICAL' ? '#fee2e2' : value === 'HIGH' ? '#fef3c7' : value === 'MEDIUM' ? '#dbeafe' : '#d1fae5';
  return (
    <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{value || 'MEDIUM'}</span>
  );
}

export default function AdminAgents() {
  const location = useLocation();
  // shared state
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // tasks state
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [assignee, setAssignee] = useState('');
  const [selected, setSelected] = useState({}); // id -> boolean
  const unassignedTasks = useMemo(() => tasks.filter(t => !t.assignedTo), [tasks]);
  const [autoAssignOnlyCriticalHigh, setAutoAssignOnlyCriticalHigh] = useState(false);
  const [autoAssignPool, setAutoAssignPool] = useState('');

  // activity state
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityNote, setActivityNote] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  // digest state
  const [digestOnlyCriticalHigh, setDigestOnlyCriticalHigh] = useState(false);
  const [digestRecipients, setDigestRecipients] = useState('');
  const [digestDryRun, setDigestDryRun] = useState(true);
  const [digestConfig, setDigestConfig] = useState(null);
  // SLA state
  const [slaConfig, setSlaConfig] = useState(null);
  const [slaDryRun, setSlaDryRun] = useState(true);

  const showSuccess = (message) => setToast({ open: true, message, severity: 'success' });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  const loadTasks = async () => {
    try {
      setLoadingTasks(true); setError('');
      const res = await axios.get(`${API_BASE}/admin/tasks`, { params: { status: 'TODO' } });
      const list = Array.isArray(res.data) ? res.data : [];
      setTasks(list);
      // default selected task for activity view
      if (!selectedTaskId && list.length > 0) setSelectedTaskId(list[0].id);
    } catch (e) {
      setError('Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  };

  const generateTasks = async () => {
    try {
      setBusy(true); setError('');
      await axios.post(`${API_BASE}/admin/tasks/generate`, null, { params: { onlyNegative: false } });
      await loadTasks();
      showSuccess('Triage complete: tasks generated');
    } catch (e) {
      setError('Failed to trigger triage');
    } finally {
      setBusy(false);
    }
  };

  const assignTask = async (id, name) => {
    if (!name) { setError('Please enter assignee name or email'); return; }
    try {
      setBusy(true); setError('');
      await axios.post(`${API_BASE}/admin/tasks/${id}/assign`, { assignedTo: name });
      await loadTasks();
      showSuccess(`Assigned task #${id} to ${name}`);
    } catch (e) {
      setError('Failed to assign task');
    } finally {
      setBusy(false);
    }
  };

  const bulkAssign = async () => {
    const name = assignee?.trim();
    const ids = Object.entries(selected).filter(([_, v]) => v).map(([k]) => Number(k));
    if (!name) { setError('Please enter assignee name or email'); return; }
    if (ids.length === 0) { setError('Select at least one task to assign'); return; }
    try {
      setBusy(true); setError('');
      for (const id of ids) {
        await axios.post(`${API_BASE}/admin/tasks/${id}/assign`, { assignedTo: name });
      }
      await loadTasks();
      setSelected({});
      showSuccess(`Assigned ${ids.length} task(s) to ${name}`);
    } catch (e) {
      setError('Bulk assign failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleSelected = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const loadActivities = async (taskId) => {
    if (!taskId) return;
    try {
      setLoadingActivities(true); setError('');
      const res = await axios.get(`${API_BASE}/admin/agents/activity/${taskId}`);
      setActivities(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('Failed to load agent activity');
    } finally {
      setLoadingActivities(false);
    }
  };

  const postActivity = async (agentName, action, note) => {
    if (!selectedTaskId) { setError('Select a task to log activity'); return; }
    try {
      setBusy(true); setError('');
      await axios.post(`${API_BASE}/admin/agents/activity`, { taskId: selectedTaskId, agent: agentName, action, note });
      await loadActivities(selectedTaskId);
      setActivityNote('');
      showSuccess('Follow-up logged');
    } catch (e) {
      setError('Failed to log activity');
    } finally {
      setBusy(false);
    }
  };

  const runFollowUp = async () => {
    try {
      setBusy(true); setError('');
      const res = await axios.post(`${API_BASE}/admin/agents/followup/run`);
      const r = res.data || {};
      showSuccess(`Follow-up run: reminded ${r.reminded||0}, escalated ${r.escalated||0}`);
      await loadTasks();
      if (selectedTaskId) await loadActivities(selectedTaskId);
    } catch (e) {
      setError('Failed to run follow-up agent');
    } finally {
      setBusy(false);
    }
  };

  const runDigest = async () => {
    try {
      setBusy(true); setError('');
      const body = { dryRun: digestDryRun, onlyCriticalHigh: digestOnlyCriticalHigh };
      if (digestRecipients && digestRecipients.trim()) {
        body.recipients = digestRecipients.split(',').map(s => s.trim()).filter(Boolean);
      }
      const res = await axios.post(`${API_BASE}/admin/agents/digest/send`, body);
      const r = res.data || {};
      const sent = r.emailsSent ?? 0;
      const considered = r.tasksConsidered ?? 0;
      const rc = r.recipientsCount ?? 0;
      showSuccess(`Digest ${digestDryRun ? 'dry-run' : 'sent'}: ${considered} task(s) across ${rc} recipient(s); emailsSent=${sent}`);
    } catch (e) {
      setError('Failed to run digest agent');
    } finally {
      setBusy(false);
    }
  };

  const runAutoAssignment = async () => {
    try {
      setBusy(true); setError('');
      const body = { onlyCriticalHigh: autoAssignOnlyCriticalHigh };
      if (autoAssignPool && autoAssignPool.trim()) {
        body.pool = autoAssignPool.split(',').map(s => s.trim()).filter(Boolean);
      }
      const res = await axios.post(`${API_BASE}/admin/agents/assignment/auto`, body);
      const r = res.data || {};
      showSuccess(`Auto-assign: assigned ${r.assigned||0} of ${r.considered||0}`);
      await loadTasks();
    } catch (e) {
      setError('Failed to run auto-assignment');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // If URL contains ?taskId=, preselect that task
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tid = params.get('taskId');
    if (tid) {
      const n = Number(tid);
      if (!Number.isNaN(n)) setSelectedTaskId(n);
    }
  }, [location.search]);

  useEffect(() => {
    loadActivities(selectedTaskId);
  }, [selectedTaskId]);

  // Auto-refresh activity timeline every 10s when enabled
  useEffect(() => {
    if (!autoRefresh || !selectedTaskId) return;
    const h = setInterval(() => loadActivities(selectedTaskId), 10000);
    return () => clearInterval(h);
  }, [autoRefresh, selectedTaskId]);

  // Load digest config for info banner
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/agents/digest/config`);
        setDigestConfig(res.data || {});
      } catch {}
    })();
  }, []);

  // Load SLA config for banner
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/agents/sla/config`);
        setSlaConfig(res.data || {});
      } catch {}
    })();
  }, []);

  const runSla = async () => {
    try {
      setBusy(true); setError('');
      const res = await axios.post(`${API_BASE}/admin/agents/sla/run`, { dryRun: slaDryRun });
      const r = res.data || {};
      showSuccess(`SLA ${slaDryRun ? 'preview' : 'run'}: reminded ${r.reminded||0}, escalated ${r.escalated||0}`);
      await loadTasks();
      if (selectedTaskId) await loadActivities(selectedTaskId);
    } catch (e) {
      setError('Failed to run SLA agent');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <TopNavBar title="Admin Agents" />
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Triage Agent */}
        <Section title="Triage Agent" action={
          <Button onClick={generateTasks} disabled={busy} variant="contained" sx={{ textTransform: 'none', background: '#0b0f19', '&:hover': { background: '#111827' }}}>
            {busy ? 'Working…' : 'Generate Tasks'}
          </Button>
        }>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Scans feedback and creates tasks with priority and links.
          </Typography>
        </Section>

        {/* Assignment Agent */}
        <Section title="Assignment Agent" action={
          <Box display="flex" gap={1}>
            <TextField size="small" placeholder="Assignee (name or email)" value={assignee} onChange={e => setAssignee(e.target.value)} />
            <Button onClick={bulkAssign} disabled={busy} variant="contained" sx={{ textTransform: 'none', background: '#0b0f19', '&:hover': { background: '#111827' }}}>
              {busy ? 'Assigning…' : 'Assign Selected'}
            </Button>
            <Button onClick={loadTasks} disabled={busy} variant="outlined" sx={{ textTransform: 'none' }}>Refresh</Button>
          </Box>
        }>
          <Box display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <TextField size="small" label="Pool (comma-separated emails)" value={autoAssignPool} onChange={e => setAutoAssignPool(e.target.value)} sx={{ minWidth: 280 }} />
            <FormControlLabel control={<Checkbox checked={autoAssignOnlyCriticalHigh} onChange={e => setAutoAssignOnlyCriticalHigh(e.target.checked)} />} label="Only critical/high" />
            <Button onClick={runAutoAssignment} disabled={busy} variant="outlined" sx={{ textTransform:'none' }}>Auto-assign</Button>
          </Box>
          {loadingTasks ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={160}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ mt: 1, border: '1px solid #e5e7eb', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f8fafc' }}>
                    <TableCell width={40}></TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Feedback</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assignee</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unassignedTasks.map(t => (
                    <TableRow key={t.id} hover selected={selected[t.id] || false} onClick={() => setSelectedTaskId(t.id)}>
                      <TableCell><Checkbox size="small" checked={!!selected[t.id]} onChange={() => toggleSelected(t.id)} /></TableCell>
                      <TableCell>#{t.id}</TableCell>
                      <TableCell><PriorityBadge value={t.priority} /></TableCell>
                      <TableCell>{t.title}</TableCell>
                      <TableCell>{t.feedback?.id || '-'}</TableCell>
                      <TableCell>{t.assignedTo || '-'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} disabled={busy} onClick={() => assignTask(t.id, assignee)}>
                          Assign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {unassignedTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: '#6b7280' }}>No unassigned tasks</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Section>

        {/* Follow-up Agent & Activity */}
        <Section title="Follow-up Agent & Activity" action={
          <Button onClick={runFollowUp} disabled={busy} variant="contained" sx={{ textTransform:'none', background:'#0b0f19', '&:hover':{ background:'#111827' }}}>
            {busy ? 'Running…' : 'Run Follow-up Now'}
          </Button>
        }>
          <Box display="flex" gap={2} alignItems="center" mb={1}>
            <TextField size="small" label="Selected Task ID" value={selectedTaskId || ''} onChange={e => setSelectedTaskId(Number(e.target.value) || null)} sx={{ width: 180 }} />
            <TextField size="small" placeholder="Add a note" value={activityNote} onChange={e => setActivityNote(e.target.value)} sx={{ flex: 1 }} />
            <Button onClick={() => postActivity('FOLLOWUP', 'NOTED', activityNote)} disabled={busy} variant="contained" sx={{ textTransform: 'none', background: '#0b0f19', '&:hover': { background: '#111827' }}}>
              {busy ? 'Logging…' : 'Log Follow-up'}
            </Button>
            <Button onClick={() => loadActivities(selectedTaskId)} disabled={loadingActivities} variant="outlined" sx={{ textTransform: 'none' }}>
              Refresh Activity
            </Button>
            <FormControlLabel control={<Switch checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />} label="Auto-refresh (10s)" />
          </Box>

          {loadingActivities ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={120}><CircularProgress /></Box>
          ) : activities.length === 0 ? (
            <Alert severity="info">No activity yet for this task.</Alert>
          ) : (
            <Box>
              {activities.map(a => (
                <Box key={a.id} sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 1.5, mb: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip size="small" label={a.agent || 'AGENT'} />
                      <Chip size="small" color="primary" variant="outlined" label={a.action || ''} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>{a.createdAt || ''}</Typography>
                  </Box>
                  {a.note && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{a.note}</Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" sx={{ color: '#6b7280' }}>
            Tip: Click a task row above to set it as the selected task for logging activity.
          </Typography>
        </Section>

        {/* Digest Agent */}
        <Section title="Digest Agent" action={
          <Button onClick={runDigest} disabled={busy} variant="contained" sx={{ textTransform: 'none', background: '#0b0f19', '&:hover': { background: '#111827' }}}>
            {busy ? 'Working…' : (digestDryRun ? 'Preview Digest' : 'Send Digest Now')}
          </Button>
        }>
          {digestConfig && (
            <Alert severity={digestConfig.enabled ? 'info' : 'warning'} sx={{ mb: 1 }}>
              <strong>Scheduled status:</strong> {digestConfig.enabled ? 'Enabled' : 'Disabled'}
              {digestConfig.cron && ` • Cron: ${digestConfig.cron}`}
              {typeof digestConfig.onlyCriticalHigh === 'boolean' && ` • Only critical/high: ${digestConfig.onlyCriticalHigh ? 'Yes' : 'No'}`}
              {Array.isArray(digestConfig.defaultRecipients) && digestConfig.defaultRecipients.length > 0 && ` • Default recipients: ${digestConfig.defaultRecipients.join(', ')}`}
              {digestConfig.lastRun && (
                <>
                  {` • Last run: ${digestConfig.lastRun.runAt || ''}`}
                  {typeof digestConfig.lastRun.emailsSent === 'number' && ` (emailsSent=${digestConfig.lastRun.emailsSent}, tasks=${digestConfig.lastRun.tasksConsidered})`}
                </>
              )}
            </Alert>
          )}
          <Box display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <TextField size="small" label="Recipients (CSV emails)" value={digestRecipients} onChange={e => setDigestRecipients(e.target.value)} sx={{ minWidth: 320 }} />
            <FormControlLabel control={<Checkbox checked={digestOnlyCriticalHigh} onChange={e => setDigestOnlyCriticalHigh(e.target.checked)} />} label="Only critical/high" />
            <FormControlLabel control={<Checkbox checked={digestDryRun} onChange={e => setDigestDryRun(e.target.checked)} />} label="Dry run (no email)" />
            <Button onClick={runDigest} disabled={busy} variant="outlined" sx={{ textTransform:'none' }}>Run</Button>
          </Box>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Sends a per-assignee summary of open TODO tasks with deep links. Provide recipients to limit delivery; otherwise, all current assignees are targeted. Use Dry run to preview counts without sending.
          </Typography>
        </Section>

        {/* SLA Agent */}
        <Section title="SLA Agent" action={
          <Button onClick={runSla} disabled={busy} variant="contained" sx={{ textTransform: 'none', background: '#0b0f19', '&:hover': { background: '#111827' }}}>
            {busy ? 'Running…' : (slaDryRun ? 'Preview SLA' : 'Run SLA Now')}
          </Button>
        }>
          {slaConfig && (
            <Alert severity={slaConfig.enabled ? 'info' : 'warning'} sx={{ mb: 1 }}>
              <strong>Scheduled status:</strong> {slaConfig.enabled ? 'Enabled' : 'Disabled'}
              {slaConfig.cron && ` • Cron: ${slaConfig.cron}`}
              {slaConfig.windows && ` • Windows (h): CRITICAL=${slaConfig.windows.CRITICAL}, HIGH=${slaConfig.windows.HIGH}, MEDIUM=${slaConfig.windows.MEDIUM}, LOW=${slaConfig.windows.LOW}`}
              {Array.isArray(slaConfig.escalationRecipients) && slaConfig.escalationRecipients.length > 0 && ` • Escalation: ${slaConfig.escalationRecipients.join(', ')}`}
              {slaConfig.lastRun && (
                <>
                  {` • Last run: ${slaConfig.lastRun.runAt || ''}`}
                  {` (reminded=${slaConfig.lastRun.reminded||0}, escalated=${slaConfig.lastRun.escalated||0})`}
                </>
              )}
            </Alert>
          )}
          <Box display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
            <FormControlLabel control={<Checkbox checked={slaDryRun} onChange={e => setSlaDryRun(e.target.checked)} />} label="Dry run (no email)" />
            <Button onClick={runSla} disabled={busy} variant="outlined" sx={{ textTransform:'none' }}>Run</Button>
          </Box>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Monitors open tasks against priority-based SLA windows. Sends reminders near due and escalations on breach.
          </Typography>
        </Section>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={closeToast}
        message={toast.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </div>
  );
}
