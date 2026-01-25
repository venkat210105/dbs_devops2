import React, { useState, useCallback, useEffect } from "react";
import { Routes, Route } from 'react-router-dom';
import RootFeedbackComponent from "./components/RootFeedbackComponent";
import FeedbackList from "./components/FeedbackList";
import Dashboard from './components/Dashboard';
import FeedbackHistory from './components/FeedbackHistory';
import ChatbotComponent from './components/ChatbotComponent';
import './App.css';
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers';
import AdminAgents from './components/AdminAgents';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { startTracking, endTracking } from './utils/pageTracker';
import { useLocation } from 'react-router-dom';

function App() {
  const theme = createTheme({ palette: { mode: 'light' } });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  
  const refreshList = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // page tracking on route change
  useEffect(() => {
    // end previous
    endTracking();
    // start new
    startTracking(location.pathname || '/');
    // on unmount
    return () => { endTracking(); };
  }, [location.pathname]);

  // track visibility pause/resume
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        endTracking();
      } else {
        startTracking(location.pathname || '/');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', endTracking);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', endTracking);
    };
  }, [location.pathname]);

  return (
    <ThemeProvider theme={theme}>
      <div className="App" style={{ background: '#fff', minHeight: '100vh' }}>
        <Routes>
          {/* Main Feedback Page with Root Component */}
          <Route path="/" element={<RootFeedbackComponent />} />

          {/* Feedback List Page */}
          <Route path="/feedback-list" element={<FeedbackList refreshTrigger={refreshTrigger} />} />

          {/* Dashboard / Analytics Page */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Feedback History with filtering */}
          <Route path="/feedback-history" element={<FeedbackHistory />} />

          {/* Admin Dashboard Page */}
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Admin Users Page */}
          <Route path="/admin/users" element={<AdminUsers />} />
          {/* Admin Agents Page */}
          <Route path="/admin/agents" element={<AdminAgents />} />
        </Routes>

        {/* Chatbot available on all pages */}
        <ChatbotComponent />
      </div>
    </ThemeProvider>
  );
}

export default App;
