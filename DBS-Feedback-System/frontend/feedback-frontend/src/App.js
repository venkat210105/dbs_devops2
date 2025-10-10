import React, { useState, useCallback } from "react";
import { Routes, Route } from 'react-router-dom';
import RootFeedbackComponent from "./components/RootFeedbackComponent";
import FeedbackList from "./components/FeedbackList";
import Dashboard from './components/Dashboard';
import FeedbackHistory from './components/FeedbackHistory';
import ChatbotComponent from './components/ChatbotComponent';
import './App.css';
import AdminDashboard from './components/AdminDashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';

function App() {
  const theme = createTheme({ palette: { mode: 'light' } });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const refreshList = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

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
        </Routes>

        {/* Chatbot available on all pages */}
        <ChatbotComponent />
      </div>
    </ThemeProvider>
  );
}

export default App;
