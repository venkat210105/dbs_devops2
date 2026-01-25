import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';

const TopNavBar = ({ title = 'Feedback', icon = <TableRowsOutlinedIcon sx={{ verticalAlign: 'middle', mr: 1, color: '#0b0f19' }} /> }) => {
  return (
    <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', color: '#0b0f19', borderBottom: '1px solid #e5e7eb' }}>
      <Toolbar sx={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          {icon} {title}
        </Typography>
  <Button color="inherit" href="/" sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}>Home</Button>
  <Button color="inherit" href="/dashboard" sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}>Dashboard</Button>
        <Button color="inherit" href="/feedback-list" sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}>Feedback List</Button>
  <Button color="inherit" href="/admin" sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}>Admin</Button>
  <Button color="inherit" href="/admin/users" sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}>Users</Button>
  <Button color="inherit" href="/admin/agents" sx={{ textTransform: 'none', fontWeight: 600 }}>Agents</Button>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavBar;
