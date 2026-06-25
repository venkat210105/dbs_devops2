import React, { useState, useEffect } from 'react';
import EnhancedFeedbackForm from './EnhancedFeedbackForm';
import './RootFeedbackComponent.css';
// Removed TopNavBar from home to avoid duplicate nav

const RootFeedbackComponent = () => {
  // Removed dark mode logic and theme toggle

  return (
  <div className="root-feedback-container">
      {/* Professional Navigation Header */}
      <div className="professional-navbar">
        <div className="navbar-inner container">
        <div className="app-brand">
          <div className="app-logo-container">
            {/* Universal Logo */}
            <div className="app-logo-container-img">
              <img 
                src={require('./image.png')} 
                alt="Universal Feedback Logo" 
                className="app-logo-image" 
              />
            </div>
            <div className="brand-text">
              <span className="brand-name">Universal Feedback System</span>
              <span className="brand-tagline">Live more, Bank less</span>
            </div>
          </div>
          <div className="system-title">
            <span className="title-main">Customer Experience</span>
            <span className="title-sub">Feedback Portal</span>
          </div>
        </div>

  <div className="navbar-controls">
          <nav className="main-navigation corporate-nav">
            <a href="/feedback-list" className="nav-item">
              <span className="nav-label">Feedback</span>
            </a>
            <a href="/admin" className="nav-item">
              <span className="nav-label">Admin</span>
            </a>
          </nav>
          <div className="user-profile">
            <div className="user-avatar-initials" aria-hidden="true">CU</div>
            <span className="user-name">User</span>
          </div>
        </div>
        </div>
      </div>

      {/* Form Display Area */}
      <div className="form-display-area">
  <EnhancedFeedbackForm />
      </div>
    </div>
  );
};

export default RootFeedbackComponent;