import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FeedbackAnalyticsChart from './FeedbackAnalyticsChart';
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

function AdminDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8085/admin/feedbacks')
      .then(res => {
        setFeedbacks(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load feedbacks');
        setLoading(false);
      });
  }, []);

  const viewDetails = (id) => {
    axios.get(`http://localhost:8085/admin/feedback/${id}`)
      .then(res => setSelectedFeedback(res.data))
      .catch(() => setError('Failed to load feedback details'));
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <BarChartOutlinedIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'black' }} /> DBS Admin Dashboard
          </Typography>
          <Button color="inherit" href="/dashboard">Dashboard</Button>
          <Button color="inherit" href="/feedback-list">Feedback List</Button>
          <Button color="inherit" href="/admin">Admin</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <BarChartOutlinedIcon sx={{ color: 'black', mr: 1 }} />
          <Typography variant="h5">Feedback Analytics</Typography>
        </Box>
        <FeedbackAnalyticsChart />
        <Box display="flex" alignItems="center" mt={4} mb={2}>
          <TableRowsOutlinedIcon sx={{ color: 'black', mr: 1 }} />
          <Typography variant="h5">All Feedbacks</Typography>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Summary</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedbacks.map(fb => (
                  <TableRow key={fb.id}>
                    <TableCell>{fb.id}</TableCell>
                    <TableCell>{fb.customerName}</TableCell>
                    <TableCell>{fb.email}</TableCell>
                    <TableCell>{fb.comment}</TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" onClick={() => viewDetails(fb.id)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {selectedFeedback && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Feedback Details</Typography>
            <Typography><b>ID:</b> {selectedFeedback.id}</Typography>
            <Typography><b>Customer Name:</b> {selectedFeedback.customerName}</Typography>
            <Typography><b>Email:</b> {selectedFeedback.email}</Typography>
            <Typography><b>Summary:</b> {selectedFeedback.comment}</Typography>
            <Typography><b>Details:</b> {selectedFeedback.feedback}</Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

export default AdminDashboard;
