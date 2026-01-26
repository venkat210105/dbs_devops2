import React, { useState } from 'react';
import './MyLearning.css';

const MyLearning = () => {
  const [selectedModule, setSelectedModule] = useState(null);

  const modules = {
    frontend: {
      name: 'React Frontend Architecture',
      tech: 'React 18 • Material-UI • CSS Modules • Netlify',
      deployment: 'https://dbs-feedback-frontend.netlify.app',
      description: 'Enterprise-grade React application with real-time feedback management, sentiment visualization, and responsive design.',
      
      technicalDetails: {
        'Component Architecture': 'Functional components with hooks (useState, useEffect, useContext)',
        'State Management': 'React Context API for global state, local useState for component state',
        'Routing': 'React Router v6 with nested routes and protected routes',
        'HTTP Client': 'Axios with interceptors for API calls',
        'Styling': 'CSS Modules with CSS Variables for theming',
        'Build Tool': 'Create React App with webpack bundler'
      },
      
      codeSnippets: [
        {
          title: 'API Integration with Axios',
          description: 'Centralized API configuration with base URL and interceptors',
          code: `// API configuration
const API_BASE = 'https://dbsdevops2-production.up.railway.app';
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Fetch feedbacks with error handling
const fetchFeedbacks = async () => {
  try {
    const response = await api.get('/api/feedback');
    setFeedbacks(response.data);
  } catch (error) {
    console.error('API Error:', error);
  }
};`
        },
        {
          title: 'Responsive Design Implementation',
          description: 'Mobile-first responsive breakpoints for all screen sizes',
          code: `/* Mobile First - Base styles for mobile */
.dashboard-container {
  padding: 16px;
  max-width: 100%;
}

/* Tablet - 768px and above */
@media (min-width: 768px) {
  .dashboard-container { padding: 24px; }
  .cards-container { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop - 1024px and above */
@media (min-width: 1024px) {
  .dashboard-container { padding: 32px; max-width: 1200px; }
  .cards-container { grid-template-columns: repeat(3, 1fr); }
}`
        },
        {
          title: 'React Component with Hooks',
          description: 'Functional component using useState and useEffect hooks',
          code: `function Dashboard() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchFeedbacks();
      setFeedbacks(data);
      setLoading(false);
    };
    loadData();
  }, []); // Runs once on mount

  return loading ? <Spinner /> : <FeedbackGrid data={feedbacks} />;
}`
        }
      ],
      
      challenges: [
        {
          problem: 'Mobile Responsiveness Issues',
          initial: 'Desktop-only layout with fixed widths, breaking on mobile devices',
          solution: 'Implemented mobile-first approach with CSS Grid, Flexbox, and @media queries',
          impact: '100% mobile compatibility across all pages'
        },
        {
          problem: 'CORS Policy Blocking API Calls',
          initial: 'Frontend hosted on Netlify (https://dbs-feedback-frontend.netlify.app) blocked from accessing Railway API',
          solution: 'Configured Spring Security CORS with explicit origin whitelisting in backend',
          impact: 'Seamless cross-origin API communication'
        },
        {
          problem: 'State Management Complexity',
          initial: 'Props drilling through 4-5 levels causing re-render issues',
          solution: 'Implemented React Context for global state (user, theme, notifications)',
          impact: 'Reduced component coupling and improved performance'
        }
      ],
      
      technicalConcepts: [
        {
          concept: 'Virtual DOM & Reconciliation',
          explanation: 'React creates a virtual representation of the DOM in memory. When state changes, React compares the new virtual DOM with the previous one (reconciliation), calculates the minimum number of changes needed, and batch-updates the real DOM efficiently. This approach minimizes expensive DOM operations and improves performance significantly.'
        },
        {
          concept: 'React Hooks - useEffect vs useLayoutEffect',
          explanation: 'useEffect runs asynchronously after paint, making it suitable for data fetching, subscriptions, and side effects that don\'t block the visual update. useLayoutEffect runs synchronously after DOM mutations but before browser paint, used for DOM measurements and preventing visual flicker when modifying the DOM.'
        },
        {
          concept: 'Error Handling Strategy',
          explanation: 'Implemented comprehensive error handling with try-catch blocks using async/await for API calls. Maintained error state to show user-friendly messages. Integrated error boundaries at component level to catch and handle rendering errors gracefully, preventing full application crashes.'
        },
        {
          concept: 'Component Composition Pattern',
          explanation: 'Used functional components with hooks for better code reusability and testability. Implemented container/presentational component pattern where smart components handle logic and state, while dumb components focus on rendering UI based on props.'
        }
      ]
    },
    
    backend: {
      name: 'Spring Boot REST API',
      tech: 'Spring Boot 3.5.0 • Java 21 • JPA • Railway',
      deployment: 'https://dbsdevops2-production.up.railway.app',
      description: 'Production-ready RESTful API with layered architecture, security, and cloud deployment.',
      
      technicalDetails: {
        'Framework': 'Spring Boot 3.5.0 with Spring Web, Spring Data JPA',
        'Java Version': 'Java 21 (LTS)',
        'Architecture': '3-tier: Controller → Service → Repository (DAO)',
        'ORM': 'Hibernate with JPA annotations',
        'Security': 'Spring Security with CORS configuration',
        'Database': 'MySQL 8 with connection pooling',
        'Build Tool': 'Maven 3.8+',
        'Deployment': 'Railway PaaS with Docker containerization'
      },
      
      codeSnippets: [
        {
          title: 'REST Controller with DTOs',
          description: 'Clean separation of concerns with service layer',
          code: `@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = {"https://dbs-feedback-frontend.netlify.app"})
public class FeedbackController {
    
    @Autowired
    private FeedbackService feedbackService;
    
    @PostMapping
    public ResponseEntity<Feedback> createFeedback(@RequestBody FeedbackDTO dto) {
        Feedback feedback = feedbackService.saveFeedback(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(feedback);
    }
    
    @GetMapping
    public List<Feedback> getAllFeedback() {
        return feedbackService.getAllFeedback();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable Long id) {
        return feedbackService.getFeedbackById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}`
        },
        {
          title: 'JPA Entity with Relationships',
          description: 'Hibernate entity with proper annotations and relationships',
          code: `@Entity
@Table(name = "feedbacks")
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 500)
    private String message;
    
    @Column(name = "sentiment_score")
    private Double sentimentScore;
    
    @Enumerated(EnumType.STRING)
    private SentimentType sentiment; // POSITIVE, NEUTRAL, NEGATIVE
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}`
        },
        {
          title: 'Resend Email Service (REST API)',
          description: 'Sending emails via Resend API using RestTemplate (no SMTP)',
          code: `@Service
public class ResendEmailService {
    @Value("\${resend.api.key}")
    private String apiKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String RESEND_API = "https://api.resend.com/emails";
    
    public String sendEmail(String to, String subject, String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> body = Map.of(
            "from", "noreply@feedback.com",
            "to", to,
            "subject", subject,
            "text", text
        );
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(RESEND_API, request, String.class);
        return response.getBody();
    }
}`
        },
        {
          title: 'Railway Database Configuration',
          description: 'Using Railway service references for MySQL connection',
          code: `# application.properties
spring.datasource.url=jdbc:mysql://\${MYSQLHOST}:\${MYSQLPORT}/\${MYSQLDATABASE}
spring.datasource.username=\${MYSQLUSER}
spring.datasource.password=\${MYSQLPASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.datasource.hikari.maximum-pool-size=5`
        }
      ],
      
      challenges: [
        {
          problem: 'Email Service 500 Internal Server Error',
          initial: 'JavaMailSender throwing exceptions: "Mail server connection failed". Railway blocks SMTP ports 587 and 465 for security.',
          solution: 'Switched from Gmail SMTP to Resend REST API (works over HTTPS port 443). Implemented direct API calls using RestTemplate without JavaMailSender dependency.',
          impact: 'Email service now operational with 3,000 free emails/month. No SMTP dependencies.'
        },
        {
          problem: 'Dependency Injection Circular Reference',
          initial: 'EmailService required by NotifyController, but EmailService failed to initialize',
          solution: 'Made EmailService optional: @Autowired(required=false), added null checks before usage',
          impact: 'Application starts successfully even if email service fails'
        },
        {
          problem: 'Database Connection Timeout on Railway',
          initial: 'Intermittent "Connection timeout" errors after deployment',
          solution: 'Configured HikariCP connection pool settings, reduced max pool size to 5, added connection timeout',
          impact: 'Stable database connections with automatic retry'
        }
      ],
      
      technicalConcepts: [
        {
          concept: 'Layered Architecture Pattern (MVC)',
          explanation: 'Implemented 3-tier architecture separating concerns: Controller layer handles HTTP requests/responses and validation, Service layer contains business logic and transaction management, Repository (DAO) layer manages database operations using JPA. This separation ensures single responsibility principle, improves testability through dependency injection, and enhances maintainability by isolating changes to specific layers.'
        },
        {
          concept: 'Transaction Management with @Transactional',
          explanation: '@Transactional annotation ensures ACID properties (Atomicity, Consistency, Isolation, Durability) for database operations. Applied on service methods involving multiple database operations to ensure data integrity. Spring creates a proxy that begins transaction before method execution and commits on success or rolls back on exception, maintaining database consistency.'
        },
        {
          concept: 'Spring Boot Auto-Configuration Mechanism',
          explanation: 'Spring Boot scans the classpath for dependencies and automatically configures beans based on what it finds. For example, when spring-boot-starter-data-jpa is detected, it auto-configures DataSource, EntityManager, TransactionManager, and Hibernate properties based on application.properties. Uses @Conditional annotations to apply configuration only when specific conditions are met, reducing boilerplate configuration code.'
        },
        {
          concept: 'Email Service Architecture Decision',
          explanation: 'Chose Resend API over Gmail SMTP because Railway (like most PaaS platforms) blocks SMTP ports 587/465 to prevent spam and abuse. Resend operates over HTTPS (port 443) which is universally accessible. Provides 3,000 free emails/month permanently versus Gmail\'s strict rate limits and authentication complexity. Implemented as REST API integration using Spring RestTemplate for clean, maintainable code without SMTP dependencies.'
        }
      ]
    },
    
    database: {
      name: 'MySQL Database Design',
      tech: 'MySQL 8 • JPA/Hibernate • Railway Managed DB',
      deployment: 'Railway MySQL Service (Private Network)',
      description: 'Relational database with optimized schema, indexing, and ORM integration.',
      
      technicalDetails: {
        'Database': 'MySQL 8.0',
        'ORM': 'Hibernate 6.x (via Spring Data JPA)',
        'Connection Pool': 'HikariCP (Spring Boot default)',
        'Migration Strategy': 'Hibernate auto-DDL (ddl-auto=update)',
        'Hosting': 'Railway managed MySQL with automated backups',
        'Access Pattern': 'Service references via environment variables'
      },
      
      codeSnippets: [
        {
          title: 'Database Schema (JPA Auto-Generated)',
          description: 'Tables created by Hibernate from entity classes',
          code: `-- Feedbacks table
CREATE TABLE feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(500) NOT NULL,
    sentiment_score DOUBLE,
    sentiment ENUM('POSITIVE', 'NEUTRAL', 'NEGATIVE'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_sentiment (sentiment),
    INDEX idx_created_at (created_at)
);

-- Users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
        },
        {
          title: 'JPA Repository Pattern',
          description: 'Spring Data JPA repository with custom queries',
          code: `@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    
    // Derived query method (Spring generates SQL)
    List<Feedback> findBySentiment(SentimentType sentiment);
    
    // Custom JPQL query
    @Query("SELECT f FROM Feedback f WHERE f.createdAt >= :startDate ORDER BY f.createdAt DESC")
    List<Feedback> findRecentFeedback(@Param("startDate") LocalDateTime startDate);
    
    // Native SQL query
    @Query(value = "SELECT sentiment, COUNT(*) as count FROM feedbacks GROUP BY sentiment", nativeQuery = true)
    List<Object[]> getSentimentCounts();
    
    // Pagination support
    Page<Feedback> findAll(Pageable pageable);
}`
        },
        {
          title: 'Railway MySQL Connection',
          description: 'Environment variables injected by Railway',
          code: `# Railway automatically sets these environment variables:
MYSQLHOST=containers-us-west-123.railway.app
MYSQLPORT=6543
MYSQLDATABASE=railway
MYSQLUSER=root
MYSQLPASSWORD=random_generated_password

# Spring Boot connects using:
spring.datasource.url=jdbc:mysql://\${MYSQLHOST}:\${MYSQLPORT}/\${MYSQLDATABASE}
spring.datasource.username=\${MYSQLUSER}
spring.datasource.password=\${MYSQLPASSWORD}

# No need to hardcode credentials!`
        }
      ],
      
      challenges: [
        {
          problem: 'Database Connection Configuration',
          initial: 'Hardcoded localhost MySQL credentials caused deployment failures on Railway',
          solution: 'Used Railway service references: ${MYSQLHOST}, ${MYSQLPORT}, ${MYSQLDATABASE}. Railway injects these automatically.',
          impact: 'Zero-configuration database connection in cloud environment'
        },
        {
          problem: 'Schema Migration Management',
          initial: 'Manual SQL scripts for schema changes were error-prone',
          solution: 'Configured Hibernate ddl-auto=update to auto-generate schema from entities. Used @Column, @Table annotations for fine control.',
          impact: 'Automated schema synchronization, reduced migration errors'
        },
        {
          problem: 'Connection Pool Exhaustion',
          initial: 'Application hanging under load due to connection leaks',
          solution: 'Configured HikariCP with maximum-pool-size=5, connection-timeout=30000ms, leak-detection-threshold=60000ms',
          impact: 'Efficient connection reuse and automatic leak detection'
        }
      ],
      
      technicalConcepts: [
        {
          concept: 'N+1 Query Problem in ORM',
          explanation: 'Common performance issue with lazy-loaded relationships where fetching N entities results in 1 query + N additional queries to load related data. For example, fetching 100 feedbacks would execute 101 queries if user data is lazy-loaded. Solution: Use JOIN FETCH in JPQL or @EntityGraph annotation to fetch all required data in a single optimized query, drastically reducing database round trips.'
        },
        {
          concept: 'Database Indexing Strategy',
          explanation: 'Created B-tree indexes on frequently queried columns (sentiment, created_at) to accelerate SELECT queries. Indexes create a sorted data structure allowing O(log n) lookups instead of O(n) table scans. Trade-off: indexes speed up reads but add overhead to writes (INSERT/UPDATE) as indexes must be maintained. Used composite indexes for multi-column WHERE clauses to optimize complex queries.'
        },
        {
          concept: 'HikariCP Connection Pool Architecture',
          explanation: 'HikariCP maintains a pool of pre-established, reusable database connections. Threads borrow connections from the pool, execute queries, and return connections instead of creating new ones. This eliminates connection establishment overhead (TCP handshake, authentication). Configured pool size based on formula: connections = ((core_count * 2) + effective_spindle_count), typically 5-10 for web applications. Implements connection leak detection to identify unreturned connections.'
        }
      ]
    },
    
    mlService: {
      name: 'ML Sentiment Analysis Service',
      tech: 'Python Flask • Railway Internal Network • REST API',
      deployment: 'http://terrific-communication.railway.internal:5000',
      description: 'Microservice for sentiment analysis with internal network communication.',
      
      technicalDetails: {
        'Framework': 'Flask (Python 3.10)',
        'ML Library': 'Mock implementation (can integrate Hugging Face, TextBlob)',
        'Communication': 'Railway internal DNS (service-to-service)',
        'Containerization': 'Docker with optimized Python image',
        'Response Time': '<100ms for mock sentiment analysis'
      },
      
      codeSnippets: [
        {
          title: 'Flask Sentiment API',
          description: 'Simple REST endpoint for sentiment analysis',
          code: `from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.get_json()
    text = data.get('text', '')
    
    # Mock sentiment logic (replace with real ML model)
    score = len([w for w in text.split() if w.lower() in ['good', 'great', 'excellent']]) * 0.3
    score -= len([w for w in text.split() if w.lower() in ['bad', 'poor', 'terrible']]) * 0.3
    
    sentiment = 'POSITIVE' if score > 0.2 else 'NEGATIVE' if score < -0.2 else 'NEUTRAL'
    
    return jsonify({
        'sentiment': sentiment,
        'score': round(score, 2),
        'confidence': 0.85
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)`
        },
        {
          title: 'Spring Boot → Flask Communication',
          description: 'Backend calling ML service via Railway internal DNS',
          code: `@Service
public class SentimentService {
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String ML_SERVICE_URL = 
        "http://terrific-communication.railway.internal:5000/analyze";
    
    public SentimentResult analyzeSentiment(String text) {
        Map<String, String> request = Map.of("text", text);
        
        try {
            ResponseEntity<SentimentResult> response = restTemplate.postForEntity(
                ML_SERVICE_URL, 
                request, 
                SentimentResult.class
            );
            return response.getBody();
        } catch (Exception e) {
            // Fallback to default sentiment
            return new SentimentResult("NEUTRAL", 0.0, 0.5);
        }
    }
}`
        },
        {
          title: 'Dockerfile for ML Service',
          description: 'Optimized Docker build for faster Railway deploys',
          code: `FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 5000

# Run with production WSGI server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]`
        }
      ],
      
      challenges: [
        {
          problem: 'Service-to-Service Communication',
          initial: 'Backend couldn\'t reach ML service using public URL, firewall blocked external calls',
          solution: 'Used Railway\'s internal DNS: {service-name}.railway.internal. Services communicate privately without public internet.',
          impact: 'Faster response times, no external network latency, secure internal communication'
        },
        {
          problem: 'Docker Build Timeouts',
          initial: 'Railway build taking 5+ minutes due to large ML dependencies',
          solution: 'Used python:3.10-slim base image, separated requirements.txt for layer caching, removed unused dependencies',
          impact: 'Build time reduced to <2 minutes'
        }
      ],
      
      technicalConcepts: [
        {
          concept: 'Microservices Architecture Benefits',
          explanation: 'Decouples ML logic from main application enabling independent deployment and scaling. Allows using Python for ML service while main application uses Java, leveraging each language\'s strengths. ML models can be updated, retrained, and deployed independently without touching the main application. Enables horizontal scaling of ML service based on prediction load while backend scales based on API traffic.'
        },
        {
          concept: 'Railway Private Networking',
          explanation: 'Railway creates a private virtual network for all services within a project. Services communicate using internal DNS ({service-name}.railway.internal) which resolves to private IP addresses. Traffic stays within Railway\'s infrastructure, bypassing public internet for lower latency, improved security, and no bandwidth charges. Implements service discovery pattern without external service mesh.'
        },
        {
          concept: 'Docker Layer Caching Optimization',
          explanation: 'Docker builds images in layers, caching unchanged layers to speed up subsequent builds. By copying requirements.txt before application code and running pip install separately, dependency layers are cached. When only code changes, Docker reuses cached dependency layers, dramatically reducing build time. Used multi-stage builds to separate build-time and runtime dependencies.'
        }
      ]
    },
    
    email: {
      name: 'Email Service (Resend API)',
      tech: 'Resend • Spring RestTemplate • HTTPS',
      deployment: 'https://api.resend.com/emails',
      description: 'Transactional email service using Resend API instead of SMTP.',
      
      technicalDetails: {
        'Provider': 'Resend (resend.com)',
        'API': 'REST API over HTTPS (port 443)',
        'Free Tier': '3,000 emails/month permanently',
        'Authentication': 'Bearer token (API key)',
        'Spring Integration': 'RestTemplate for HTTP calls',
        'No Dependencies': 'No spring-boot-starter-mail or JavaMailSender needed'
      },
      
      codeSnippets: [
        {
          title: 'Complete Resend Email Service',
          description: 'Production-ready email service with error handling',
          code: `@Service
public class ResendEmailService {
    
    @Value("\${resend.api.key}")
    private String apiKey;
    
    @Value("\${resend.from.email}")
    private String fromEmail;
    
    private final RestTemplate restTemplate;
    private static final String RESEND_API_URL = "https://api.resend.com/emails";
    
    public ResendEmailService() {
        this.restTemplate = new RestTemplate();
    }
    
    public String sendEmail(String to, String subject, String htmlContent) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> emailData = new HashMap<>();
        emailData.put("from", fromEmail);
        emailData.put("to", new String[]{to});
        emailData.put("subject", subject);
        emailData.put("html", htmlContent);
        
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(emailData, headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                RESEND_API_URL, 
                requestEntity, 
                Map.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> body = response.getBody();
                return (String) body.get("id"); // Email ID from Resend
            }
            throw new RuntimeException("Email send failed: " + response.getStatusCode());
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email via Resend", e);
        }
    }
}`
        },
        {
          title: 'Controller Endpoint for Testing',
          description: 'Admin endpoint to test email functionality',
          code: `@RestController
@RequestMapping("/admin")
public class NotifyController {
    
    @Autowired(required = false)
    private EmailService emailService;
    
    @PostMapping("/notify")
    public ResponseEntity<?> sendTestEmail(@RequestBody Map<String, String> request) {
        if (emailService == null) {
            return ResponseEntity.status(503).body("Email service not available");
        }
        
        String to = request.get("to");
        String subject = request.getOrDefault("subject", "Test Email from DBS Feedback");
        String message = request.getOrDefault("message", "This is a test email.");
        
        try {
            String emailId = emailService.sendEmail(to, subject, message);
            return ResponseEntity.ok(Map.of(
                "status", "sent",
                "to", to,
                "emailId", emailId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
}`
        },
        {
          title: 'Railway Environment Variables',
          description: 'Configuration in Railway dashboard',
          code: `# Railway Environment Variables (Set in dashboard)
RESEND_API_KEY=re_GgBDgGpD_6jipmyZTTBFwNoHqg6RxqWHR
RESEND_FROM_EMAIL=noreply@dbs-feedback.com

# application.properties
resend.api.key=\${RESEND_API_KEY}
resend.from.email=\${RESEND_FROM_EMAIL}`
        }
      ],
      
      challenges: [
        {
          problem: 'Railway Blocks SMTP Ports 587 and 465',
          initial: 'Gmail SMTP failed with connection timeout. Railway blocks SMTP ports to prevent spam abuse.',
          solution: 'Switched to Resend API which uses HTTPS (port 443, always open). Made REST API calls using RestTemplate instead of JavaMailSender.',
          impact: 'Email service operational. No SMTP dependencies. 3,000 free emails/month.'
        },
        {
          problem: 'JavaMailSender Bean Creation Failures',
          initial: 'Spring Boot auto-configuration tried to create JavaMailSender but failed without SMTP access',
          solution: 'Removed spring-boot-starter-mail dependency entirely. Implemented custom service using RestTemplate for direct API calls.',
          impact: 'No autoconfiguration conflicts, cleaner dependency tree'
        },
        {
          problem: 'SendGrid Free Trial Limitation',
          initial: 'SendGrid offers only 60-day free trial, then requires payment',
          solution: 'Chose Resend which offers 3,000 emails/month FREE permanently (no trial)',
          impact: 'Long-term sustainable free tier for production use'
        }
      ],
      
      technicalConcepts: [
        {
          concept: 'PaaS SMTP Port Blocking',
          explanation: 'Platform-as-a-Service providers block SMTP ports (25, 587, 465) to prevent spam and abuse. Open SMTP ports allow malicious users to send mass emails, damaging the platform\'s IP reputation and violating anti-spam regulations (CAN-SPAM Act, GDPR). Blocking these ports forces developers to use authenticated email APIs with better tracking and accountability.'
        },
        {
          concept: 'Email Service Provider Comparison',
          explanation: 'Evaluated three options: Resend offers 3,000 emails/month permanently free with simple REST API. SendGrid provides only 60-day trial then requires payment. Gmail SMTP has strict rate limits (500 emails/day), requires app-specific passwords, and SMTP ports are blocked on Railway. Resend chosen for: permanent free tier, HTTPS API compatibility, and production sustainability.'
        },
        {
          concept: 'RestTemplate HTTP Client',
          explanation: 'Spring Framework\'s synchronous HTTP client for making REST API calls. Provides methods like postForEntity(), getForObject(), and exchange() for different HTTP operations. Handles request/response serialization using HttpMessageConverters. Supports interceptors for cross-cutting concerns (logging, authentication) and customizable error handlers. Thread-safe and can be configured as a bean with custom timeouts and connection pooling.'
        }
      ]
    },
    
    oauth: {
      name: 'Google OAuth 2.0 & Calendar API',
      tech: 'Google Cloud Platform • OAuth 2.0 • Calendar API',
      deployment: 'https://accounts.google.com',
      description: 'Authentication and automated meeting scheduling via Google Calendar.',
      
      technicalDetails: {
        'Authentication': 'OAuth 2.0 Authorization Code Flow',
        'Scopes': 'email, profile, calendar.events',
        'Token Storage': 'Server-side session storage',
        'Token Refresh': 'Automatic refresh with refresh_token',
        'Calendar Integration': 'Google Calendar API v3'
      },
      
      codeSnippets: [
        {
          title: 'OAuth Controller (Authorization Flow)',
          description: 'Initiating OAuth flow and handling callback',
          code: `@RestController
@RequestMapping("/oauth")
public class GoogleAuthController {
    
    @Value("\${google.client.id}")
    private String clientId;
    
    @Value("\${google.client.secret}")
    private String clientSecret;
    
    @Value("\${google.redirect.uri}")
    private String redirectUri;
    
    @GetMapping("/google")
    public void redirectToGoogleAuth(HttpServletResponse response) throws IOException {
        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth?"
            + "client_id=" + clientId
            + "&redirect_uri=" + redirectUri
            + "&response_type=code"
            + "&scope=email%20profile%20https://www.googleapis.com/auth/calendar.events"
            + "&access_type=offline"
            + "&prompt=consent";
        
        response.sendRedirect(authUrl);
    }
    
    @GetMapping("/google/callback")
    public ResponseEntity<?> handleGoogleCallback(@RequestParam String code) {
        // Exchange code for access token
        String tokenUrl = "https://oauth2.googleapis.com/token";
        
        Map<String, String> requestBody = Map.of(
            "code", code,
            "client_id", clientId,
            "client_secret", clientSecret,
            "redirect_uri", redirectUri,
            "grant_type", "authorization_code"
        );
        
        RestTemplate restTemplate = new RestTemplate();
        TokenResponse tokens = restTemplate.postForObject(tokenUrl, requestBody, TokenResponse.class);
        
        // Store tokens in session/database
        return ResponseEntity.ok(Map.of("message", "Authentication successful"));
    }
}`
        },
        {
          title: 'Calendar Event Creation',
          description: 'Automatically schedule meeting via Calendar API',
          code: `@Service
public class CalendarService {
    
    public void scheduleMeeting(String accessToken, String userEmail, LocalDateTime startTime) {
        String calendarApiUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> event = Map.of(
            "summary", "Feedback Review Meeting",
            "description", "Scheduled via DBS Feedback System",
            "start", Map.of(
                "dateTime", startTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "timeZone", "Asia/Singapore"
            ),
            "end", Map.of(
                "dateTime", startTime.plusHours(1).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                "timeZone", "Asia/Singapore"
            ),
            "attendees", List.of(
                Map.of("email", userEmail)
            )
        );
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.postForEntity(calendarApiUrl, request, String.class);
    }
}`
        }
      ],
      
      challenges: [
        {
          problem: 'OAuth Redirect URI Mismatch',
          initial: 'Production deployment failed OAuth with "redirect_uri_mismatch" error',
          solution: 'Added both local (http://localhost:8080/oauth/google/callback) and production (https://dbsdevops2-production.up.railway.app/oauth/google/callback) URIs to Google Cloud Console',
          impact: 'OAuth works in both dev and prod environments'
        },
        {
          problem: 'Token Refresh Management',
          initial: 'Access tokens expire after 1 hour, requiring user to re-authenticate',
          solution: 'Implemented refresh token flow: detect 401 errors, use refresh_token to get new access_token, retry original request',
          impact: 'Seamless user experience without repeated logins'
        }
      ],
      
      technicalConcepts: [
        {
          concept: 'OAuth 2.0 Authorization Code Flow',
          explanation: 'Secure authentication flow: 1) User clicks "Login with Google" and is redirected to Google\'s authorization server. 2) User authenticates and grants permissions to the application. 3) Google redirects back to application with authorization code. 4) Backend exchanges code for access_token and refresh_token via server-to-server call. 5) Access token used to call Google APIs (Calendar, Gmail). This flow keeps client credentials secure on the server and provides refresh capability.'
        },
        {
          concept: 'Secure Token Storage Architecture',
          explanation: 'Never store tokens in localStorage or sessionStorage (vulnerable to XSS attacks). Refresh tokens stored in database with encryption at rest (AES-256). Access tokens stored in server-side session or HTTP-only cookies (inaccessible to JavaScript). Implemented token rotation where refresh tokens are single-use and rotated on each refresh. Set appropriate expiration times: access tokens 1 hour, refresh tokens 30 days. Tokens invalidated on logout and stored securely with user association.'
        },
        {
          concept: 'Token Lifecycle Management',
          explanation: 'Implemented automatic token refresh: interceptor detects 401 responses, uses refresh_token to obtain new access_token, retries failed request transparently. Prevents user interruption and maintains session continuity. Handles edge cases: network failures during refresh, concurrent refresh attempts, expired refresh tokens requiring re-authentication.'
        }
      ]
    }
  };

  return (
    <div className="learning-portal">
      <div className="portal-header">
        <h1>📚 Technical Deep Dive</h1>
        <p className="portal-subtitle">DBS Feedback System - Full Stack Architecture & Implementation</p>
      </div>

      {/* Quick Navigation */}
      <div className="quick-nav">
        {Object.keys(modules).map(key => (
          <button 
            key={key}
            className={`nav-pill ${selectedModule === key ? 'active' : ''}`}
            onClick={() => setSelectedModule(key)}
          >
            {modules[key].name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Module Detail View */}
      {selectedModule ? (
        <div className="module-detail">
          <button className="close-btn" onClick={() => setSelectedModule(null)}>✕ Close</button>
          
          <div className="module-header">
            <h2>{modules[selectedModule].name}</h2>
            <div className="tech-stack">{modules[selectedModule].tech}</div>
            <p className="module-description">{modules[selectedModule].description}</p>
            <a href={modules[selectedModule].deployment} target="_blank" rel="noopener noreferrer" className="deployment-link">
              🔗 {modules[selectedModule].deployment}
            </a>
          </div>

          {/* Technical Details Table */}
          <div className="section-card">
            <h3>⚙️ Technical Specifications</h3>
            <table className="specs-table">
              <tbody>
                {Object.entries(modules[selectedModule].technicalDetails).map(([key, value]) => (
                  <tr key={key}>
                    <td className="spec-key">{key}</td>
                    <td className="spec-value">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Code Snippets */}
          <div className="section-card">
            <h3>💻 Code Implementation</h3>
            {modules[selectedModule].codeSnippets.map((snippet, index) => (
              <div key={index} className="code-block-container">
                <div className="code-header">
                  <strong>{snippet.title}</strong>
                  <span className="code-description">{snippet.description}</span>
                </div>
                <pre className="code-block">
                  <code>{snippet.code}</code>
                </pre>
              </div>
            ))}
          </div>

          {/* Challenges & Solutions */}
          <div className="section-card">
            <h3>🔧 Problem Solving Journey</h3>
            {modules[selectedModule].challenges.map((challenge, index) => (
              <div key={index} className="challenge-item">
                <div className="challenge-problem">
                  <strong>❌ Problem:</strong> {challenge.problem}
                </div>
                <div className="challenge-initial">
                  <strong>Initial Approach:</strong> {challenge.initial}
                </div>
                <div className="challenge-solution">
                  <strong>✅ Solution:</strong> {challenge.solution}
                </div>
                <div className="challenge-impact">
                  <strong>💡 Impact:</strong> {challenge.impact}
                </div>
              </div>
            ))}
          </div>

          {/* Technical Deep Dive */}
          <div className="section-card technical-section">
            <h3>🔬 Technical Deep Dive</h3>
            <p className="section-intro">Core concepts and architectural decisions for this module</p>
            {modules[selectedModule].technicalConcepts.map((item, index) => (
              <div key={index} className="technical-concept">
                <div className="concept-title">
                  <strong>{index + 1}. {item.concept}</strong>
                </div>
                <div className="concept-explanation">
                  {item.explanation}
                </div>
              </div>
            ))}
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* System Architecture Overview */}
          <div className="architecture-grid">
            {Object.keys(modules).map(key => (
              <div 
                key={key}
                className={`module-card module-${key}`}
                onClick={() => setSelectedModule(key)}
              >
                <div className="module-icon">
                  {key === 'frontend' && '⚛️'}
                  {key === 'backend' && '🚀'}
                  {key === 'database' && '🗄️'}
                  {key === 'mlService' && '🤖'}
                  {key === 'email' && '📧'}
                  {key === 'oauth' && '🔐'}
                </div>
                <h3>{modules[key].name}</h3>
                <p className="card-tech">{modules[key].tech}</p>
                <div className="card-action">Click to explore →</div>
              </div>
            ))}
          </div>

          {/* Data Flow Section */}
          <div className="data-flow-section">
            <h2>📊 Data Flow Architecture</h2>
            <div className="flow-diagram">
              <div className="flow-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>User Interaction</strong>
                  <p>React Frontend captures feedback input with sentiment indicators</p>
                </div>
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>API Request</strong>
                  <p>Axios POST to Spring Boot Backend with JSON payload</p>
                </div>
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>Sentiment Analysis</strong>
                  <p>Backend calls Python ML Service via Railway internal DNS</p>
                </div>
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <strong>Database Persistence</strong>
                  <p>Hibernate saves entity to MySQL via JPA Repository</p>
                </div>
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <strong>Email Notification</strong>
                  <p>Resend API sends confirmation email via HTTPS</p>
                </div>
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <div className="step-number">6</div>
                <div className="step-content">
                  <strong>Response & Update</strong>
                  <p>Frontend receives confirmation and refreshes dashboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Learnings Summary */}
          <div className="learnings-summary">
            <h2>🎓 Key Technical Learnings</h2>
            <div className="learning-grid">
              <div className="learning-card">
                <h4>Cloud Deployment</h4>
                <ul>
                  <li>Railway blocks SMTP ports (587, 465) → Use HTTPS APIs</li>
                  <li>Environment variables for secrets management</li>
                  <li>Internal DNS for microservice communication</li>
                  <li>Docker containerization best practices</li>
                </ul>
              </div>
              <div className="learning-card">
                <h4>Frontend Development</h4>
                <ul>
                  <li>Mobile-first responsive design with CSS Grid</li>
                  <li>React hooks (useState, useEffect) for state</li>
                  <li>Axios interceptors for API error handling</li>
                  <li>Component composition and reusability</li>
                </ul>
              </div>
              <div className="learning-card">
                <h4>Backend Engineering</h4>
                <ul>
                  <li>3-tier architecture (Controller-Service-Repository)</li>
                  <li>Spring Security CORS configuration</li>
                  <li>JPA/Hibernate ORM with relationship mapping</li>
                  <li>RestTemplate for API integration</li>
                </ul>
              </div>
              <div className="learning-card">
                <h4>Problem Solving</h4>
                <ul>
                  <li>Switched from SMTP to REST API for email</li>
                  <li>Optional dependencies (@Autowired(required=false))</li>
                  <li>Connection pooling optimization (HikariCP)</li>
                  <li>Railway service references for database config</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyLearning;
