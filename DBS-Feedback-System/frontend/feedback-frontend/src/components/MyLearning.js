import React, { useState } from 'react';
import './MyLearning.css';

const MyLearning = () => {
  const [selectedModule, setSelectedModule] = useState(null);

  const modules = {
    frontend: {
      name: 'React Frontend',
      tech: 'React 18, CSS Modules, Netlify',
      url: 'https://dbs-feedback-frontend.netlify.app',
      challenges: [
        'Mobile responsiveness - Initially not responsive for mobile screens',
        'CORS issues with backend API calls',
        'State management across multiple components'
      ],
      solutions: [
        'Added comprehensive @media queries for 1024px, 768px, and 480px breakpoints',
        'Configured CORS in Spring Security backend',
        'Used React hooks and context for state management'
      ],
      initialApproach: 'Started with basic desktop-only layout',
      finalApproach: 'Mobile-first responsive design with flexible grid layouts'
    },
    backend: {
      name: 'Spring Boot Backend',
      tech: 'Spring Boot 3.5.0, Java 21, Railway',
      url: 'https://dbsdevops2-production.up.railway.app',
      challenges: [
        'Email service 500 errors - JavaMailSender bean creation failures',
        'SMTP ports (587, 465) blocked by Railway',
        'Dependency injection issues with optional services',
        'Application crashes due to autoconfiguration conflicts'
      ],
      solutions: [
        'Made EmailService dependencies optional with @Autowired(required=false)',
        'Switched from Gmail SMTP to Resend REST API (works over HTTPS)',
        'Used RestTemplate to call Resend API directly without SDK dependencies',
        'Removed problematic autoconfiguration exclusions'
      ],
      initialApproach: 'Attempted Gmail SMTP with JavaMailSender',
      finalApproach: 'Resend API via HTTPS for Railway compatibility'
    },
    database: {
      name: 'MySQL Database',
      tech: 'MySQL 8, Spring Data JPA, Hibernate',
      url: 'Railway MySQL Service',
      challenges: [
        'Connection configuration with Railway service references',
        'Database migrations and schema updates',
        'Proper connection pooling and timeouts'
      ],
      solutions: [
        'Used Railway variable references: ${{MySQL.MYSQLHOST}}',
        'Configured spring.jpa.hibernate.ddl-auto=update for auto-migrations',
        'Set proper connection timeout and pool settings'
      ],
      initialApproach: 'Local MySQL with hardcoded credentials',
      finalApproach: 'Railway-managed MySQL with environment variable references'
    },
    mlService: {
      name: 'ML Sentiment Service',
      tech: 'Python Flask, Railway Internal Network',
      url: 'http://terrific-communication.railway.internal:5000',
      challenges: [
        'Service discovery between Railway services',
        'Docker build optimization for faster deploys',
        'Mock vs real ML model deployment'
      ],
      solutions: [
        'Used Railway internal DNS for service-to-service communication',
        'Optimized Dockerfile to reduce build times',
        'Deployed mock service for faster response times'
      ],
      initialApproach: 'External ML API endpoints',
      finalApproach: 'Internal Railway service communication'
    },
    email: {
      name: 'Email Service (Resend)',
      tech: 'Resend REST API, Spring RestTemplate',
      url: 'https://api.resend.com/emails',
      challenges: [
        'Railway blocks SMTP ports 587 and 465',
        'Gmail SMTP connection timeouts',
        'JavaMailSender bean creation failures',
        'SendGrid free trial limitations (60 days only)'
      ],
      solutions: [
        'Switched to Resend API (3,000 emails/month FREE forever)',
        'Implemented direct REST API calls using Spring RestTemplate',
        'Removed dependency on JavaMailSender',
        'Email now works via HTTPS (port 443) which Railway allows'
      ],
      initialApproach: 'Gmail SMTP with spring-boot-starter-mail',
      finalApproach: 'Resend REST API over HTTPS'
    },
    oauth: {
      name: 'Google OAuth & Calendar',
      tech: 'Google OAuth2, Calendar API',
      url: 'https://accounts.google.com',
      challenges: [
        'OAuth token refresh management',
        'Calendar API integration for meeting scheduling',
        'Redirect URI configuration for production'
      ],
      solutions: [
        'Configured Google Cloud Console with proper redirect URIs',
        'Implemented token refresh mechanism',
        'Set up calendar auto-scheduling with configurable duration'
      ],
      initialApproach: 'Manual meeting scheduling',
      finalApproach: 'Automated calendar integration with OAuth'
    }
  };

  return (
    <div className="my-learning-container">
      <h1>DBS Feedback System - Learning Journey</h1>
      
      {/* Architecture Diagram */}
      <section className="architecture-section">
        <h2>System Architecture</h2>
        <div className="architecture-diagram">
          <div className="arch-layer frontend-layer">
            <div 
              className="arch-node frontend-node"
              onClick={() => setSelectedModule('frontend')}
            >
              <h3>React Frontend</h3>
              <p>Netlify</p>
            </div>
          </div>
          
          <div className="arch-layer backend-layer">
            <div 
              className="arch-node backend-node"
              onClick={() => setSelectedModule('backend')}
            >
              <h3>Spring Boot API</h3>
              <p>Railway</p>
            </div>
          </div>
          
          <div className="arch-layer services-layer">
            <div 
              className="arch-node db-node"
              onClick={() => setSelectedModule('database')}
            >
              <h3>MySQL DB</h3>
              <p>Railway</p>
            </div>
            
            <div 
              className="arch-node ml-node"
              onClick={() => setSelectedModule('mlService')}
            >
              <h3>ML Service</h3>
              <p>Python Flask</p>
            </div>
            
            <div 
              className="arch-node email-node"
              onClick={() => setSelectedModule('email')}
            >
              <h3>Resend API</h3>
              <p>Email Service</p>
            </div>
            
            <div 
              className="arch-node oauth-node"
              onClick={() => setSelectedModule('oauth')}
            >
              <h3>Google OAuth</h3>
              <p>Calendar API</p>
            </div>
          </div>
        </div>
        
        <div className="data-flow">
          <h3>Data Flow</h3>
          <ol>
            <li><strong>User Submits Feedback</strong> → Frontend sends POST to Backend API</li>
            <li><strong>Backend Processes</strong> → Stores in MySQL, calls ML Service for sentiment analysis</li>
            <li><strong>ML Service Returns</strong> → Sentiment score sent back to Backend</li>
            <li><strong>Email Notification</strong> → Backend triggers Resend API to notify team</li>
            <li><strong>Calendar Scheduling</strong> → Backend uses Google Calendar API for meeting setup</li>
            <li><strong>Frontend Updates</strong> → User sees confirmation, admins see dashboard updates</li>
          </ol>
        </div>
      </section>

      {/* Module Details */}
      {selectedModule && (
        <section className="module-details">
          <div className="module-header">
            <h2>{modules[selectedModule].name}</h2>
            <button onClick={() => setSelectedModule(null)} className="close-btn">✕</button>
          </div>
          
          <div className="module-content">
            <div className="detail-section">
              <h3>Technology Stack</h3>
              <p className="tech-stack">{modules[selectedModule].tech}</p>
              <p className="module-url">
                <strong>URL:</strong> <code>{modules[selectedModule].url}</code>
              </p>
            </div>

            <div className="detail-section">
              <h3>Challenges Faced</h3>
              <ul className="challenges-list">
                {modules[selectedModule].challenges.map((challenge, idx) => (
                  <li key={idx}>{challenge}</li>
                ))}
              </ul>
            </div>

            <div className="detail-section">
              <h3>Solutions Implemented</h3>
              <ul className="solutions-list">
                {modules[selectedModule].solutions.map((solution, idx) => (
                  <li key={idx}>{solution}</li>
                ))}
              </ul>
            </div>

            <div className="detail-section evolution">
              <h3>Evolution</h3>
              <div className="evolution-path">
                <div className="initial">
                  <h4>Initial Approach</h4>
                  <p>{modules[selectedModule].initialApproach}</p>
                </div>
                <div className="arrow">→</div>
                <div className="final">
                  <h4>Final Solution</h4>
                  <p>{modules[selectedModule].finalApproach}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Key Learnings */}
      <section className="learnings-section">
        <h2>Key Learnings & Best Practices</h2>
        <div className="learning-cards">
          <div className="learning-card">
            <h3>🚀 Deployment</h3>
            <ul>
              <li>PaaS platforms (Railway, Netlify) block SMTP for security</li>
              <li>Use API-based email services (Resend, SendGrid) instead</li>
              <li>Environment variables for configuration management</li>
              <li>Railway internal DNS for service-to-service communication</li>
            </ul>
          </div>

          <div className="learning-card">
            <h3>🎨 Frontend</h3>
            <ul>
              <li>Mobile-first responsive design is essential</li>
              <li>Use CSS Grid and Flexbox for flexible layouts</li>
              <li>Media queries at 1024px, 768px, 480px breakpoints</li>
              <li>CORS configuration needed for cross-origin API calls</li>
            </ul>
          </div>

          <div className="learning-card">
            <h3>⚙️ Backend</h3>
            <ul>
              <li>Make dependencies optional with @Autowired(required=false)</li>
              <li>Graceful error handling for missing services</li>
              <li>Use REST APIs over HTTPS instead of SMTP</li>
              <li>Spring Boot autoconfiguration can cause conflicts</li>
            </ul>
          </div>

          <div className="learning-card">
            <h3>📧 Email</h3>
            <ul>
              <li>SMTP ports 25, 465, 587 blocked on most cloud platforms</li>
              <li>Resend offers 3,000 free emails/month (no trial limits)</li>
              <li>Use RestTemplate for direct API integration</li>
              <li>Always have fallback error messages for users</li>
            </ul>
          </div>
        </div>
      </section>
      
      <section className="credentials-note">
        <h2>📝 Configuration & Credentials</h2>
        <p className="note-text">
          For security reasons, all credentials and API keys are stored securely in:
        </p>
        <ul>
          <li><strong>Railway Environment Variables</strong> - Backend configuration</li>
          <li><strong>Netlify Settings</strong> - Frontend environment</li>
          <li><strong>Local Documentation</strong> - See CREDENTIALS_DO_NOT_COMMIT.md (not in git)</li>
        </ul>
      </section>
    </div>
  );
};

export default MyLearning;
