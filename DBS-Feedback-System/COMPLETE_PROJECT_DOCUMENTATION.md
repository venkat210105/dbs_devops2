# Universal Feedback System - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Services Breakdown](#services-breakdown)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Code Structure](#code-structure)
8. [Key Features](#key-features)
9. [Data Flows](#data-flows)
10. [Deployment](#deployment)

---

## 1. Project Overview

**Universal Feedback System** is a full-stack enterprise feedback collection and analytics platform with AI-assisted orchestration for Universal Bank customers.

### Purpose
- Collect customer feedback through multiple channels (Web UI, Chatbot, Email, CSV Import)
- Analyze sentiment using ML models
- Create automated tasks for admin follow-up
- Track user behavior and analytics
- Manage customer profiles and feedback history

### Key Capabilities
- **Multi-channel feedback collection**: Web forms, chatbot conversations, email parsing, CSV uploads
- **AI-powered sentiment analysis**: Automatic classification of feedback (Positive/Negative/Neutral)
- **Intelligent task management**: Auto-generate tasks for negative feedback
- **Agent automation**: Email digest, SLA monitoring, auto-assignment, follow-up reminders
- **User profile tracking**: Link all feedback to individual customers
- **Real-time analytics**: Dashboard with metrics, trends, and insights
- **Page tracking**: Monitor user behavior and dwell times

---

## 2. System Architecture

### Component Diagram
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Browser   │─────▶│   Nginx     │─────▶│   React     │
│   Client    │      │  (Port 80)  │      │  Frontend   │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Spring     │◀────▶┌─────────────┐
                     │  Backend    │      │   MySQL     │
                     │  (Port 8085)│      │ (Port 3306) │
                     └─────────────┘      └─────────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │Orchestr. │ │ML Service│ │ Chatbot  │
         │(Py 5050) │ │(Py 5000) │ │(JS 4002) │
         └──────────┘ └──────────┘ └──────────┘
                                         │
                                         ▼
                                  ┌──────────┐
                                  │ HF Chat  │
                                  │(Py 5001) │
                                  └──────────┘
```

### Network Configuration
- **Docker Network**: `feedback-net` (bridge mode)
- **Host Ports**:
  - Frontend: 3000 → Container 80
  - Backend: 8085 → Container 8085
  - MySQL: 3307 → Container 3306
  - ML Service: 5000
  - Orchestrator: 5050
  - Chatbot: 4002
  - HF Chat: 5001

---

## 3. Technology Stack

### Frontend
- **React** 18.x - UI library
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Nginx** - Production web server

### Backend
- **Spring Boot** 3.5.0
- **Java** 21
- **Spring Data JPA** - ORM
- **MySQL Connector** - Database driver
- **Spring Validation** - Input validation
- **Thymeleaf** - Email templates
- **Google HTTP Client** - OAuth integration
- **Spring Boot Mail** - Email sending

### Orchestrator
- **FastAPI** - Python web framework
- **LangGraph** - Agent orchestration
- **httpx** - Async HTTP client
- **Pydantic** - Data validation

### ML Service
- **FastAPI** - Python web framework
- **Transformers** (Hugging Face) - NLP models
- **PyTorch** - ML framework

### Chatbot
- **Node.js** + **Express** - Web server
- **Axios** - HTTP requests

### Database
- **MySQL** 8.0.35
- **InnoDB** engine
- **UTF-8 MB4** charset

### DevOps
- **Docker** + **Docker Compose** - Containerization
- **Jenkins** - CI/CD pipeline
- **Kubernetes** - Orchestration (k8s configs available)

---

## 4. Services Breakdown

### 4.1 Frontend (React + Nginx)

**Container**: `feedback-frontend`
**Port**: 3000:80

#### Key Components

**App.js** - Root component with routing
```javascript
- Routes: /, /feedback-list, /dashboard, /feedback-history, /admin, /admin/users, /admin/agents
- Page tracking on route changes
- Visibility change handling
- ChatbotComponent available on all pages
```

**RootFeedbackComponent.js** - Home page
```javascript
- Professional navbar with Universal branding
- Navigation to feedback list and admin
- Renders EnhancedFeedbackForm
```

**EnhancedFeedbackForm** - Main feedback submission form
- Fields: Name, Email, Rating (1-5), Service Category, Service Channel, Customer Type, Business Unit, Feedback text
- Real-time validation
- ML sentiment analysis display
- Success/error notifications

**AdminDashboard** - Admin analytics
- Task management (view, create, mark done, delete)
- Feedback analytics
- Implicit behavior analytics
- Recent alerts

**AdminUsers** - User management
- List all user profiles
- View individual user details
- View user's feedback history with filters (date range, sentiment, topic)

**AdminAgents** - Agent automation controls
- Email Digest Agent (send scheduled email summaries)
- SLA Agent (monitor and escalate overdue tasks)
- Assignment Agent (auto-assign tasks to team)
- Follow-up Agent (remind owners of pending tasks)
- Dry-run mode for testing

**ChatbotComponent** - Floating chat widget
- Collapsible chat interface
- Session-based conversations
- Integrates with orchestrator for AI responses
- Can submit feedback through conversation

**Dashboard** - Public analytics
- Total feedback count
- Average rating
- Sentiment distribution chart
- Recent feedback list

**FeedbackHistory** - Filtered feedback view
- Date range filtering
- Sentiment filtering
- Category filtering
- Export capabilities

#### Page Tracker (utils/pageTracker.js)
```javascript
Tracks user behavior:
- startTracking(path) - Records page visit start time
- endTracking() - Sends duration to backend
- Heartbeat every 30 seconds for long sessions
- Posts to /tracking/page-view/start, /heartbeat, /end
```

---

### 4.2 Backend (Spring Boot Java)

**Container**: `feedback-backend`
**Port**: 8085

#### Main Application

**Application.java**
```java
@SpringBootApplication
@EnableAsync - Enables async method execution
@EnableScheduling - Enables scheduled tasks (@Scheduled annotations)

Main entry point, bootstraps Spring context
CommandLineRunner for database test on startup
```

#### Models

**Feedback.java** - Core feedback entity
```java
@Entity @Table(name = "feedback")
Fields:
- id (Long, auto-increment)
- userName, userEmail, productId, rating (1-5), comment
- customerName, feedback (detailed text), email
- serviceCategory, serviceChannel, customerType, businessUnit
- sentimentLabel (POSITIVE/NEGATIVE/NEUTRAL)
- sentimentScore (0.0-1.0)
- topic (extracted topic)
- createdAt, updatedAt (auto-managed)
- userProfile (ManyToOne FK to UserProfile)
- scheduledAt (for future-scheduled feedback)

Relationships:
- @ManyToOne with UserProfile (fetch=LAZY)
```

**UserProfile.java** - Customer profile entity
```java
@Entity @Table(name = "user_profiles")
Fields:
- id (Long)
- email (unique constraint)
- userName (display name)
- customerName (full name)
- createdAt, updatedAt

Purpose: Aggregate all feedback from same user
Unique constraint on email prevents duplicates
```

**FeedbackTask.java** - Admin task entity
```java
@Entity @Table(name = "feedback_tasks")
Fields:
- id, feedbackId (FK), title, description
- priority (LOW/MEDIUM/HIGH/CRITICAL)
- status (TODO/IN_PROGRESS/DONE)
- assignedTo (email), resolutionNote
- createdAt, updatedAt, dueAt, completedAt

Relationships:
- @ManyToOne with Feedback
```

**PageView.java** - Page tracking entity
```java
@Entity @Table(name = "page_views")
Fields:
- id, sessionId, path
- startAtMs, endAtMs, durationMs
- uaHash, ipHash (anonymized)
- createdAt

Purpose: Track user behavior on pages
Calculate p95/p99 dwell times for analytics
```

#### Controllers

**FeedbackController.java** - `/feedback/*`
```java
POST /submit - Submit new feedback
  - Sets defaults (rating=5, productId=1, userEmail=implicit@system.local)
  - Calls FeedbackService.saveFeedback()
  - Returns saved Feedback entity
  
POST /submit-fast - Fast submission with timeout control

GET /ml-status - Check if ML service is available

GET /all - Retrieve all feedback

DELETE /{id} - Delete feedback by ID

PUT /{id} - Update existing feedback
```

**AdminDashboardController.java** - `/admin/*`
```java
GET /dashboard - Aggregated metrics (total, avg rating, by category)
GET /analytics - Detailed analytics map
GET /feedbacks - All feedback with sorting
GET /feedback/{id} - Single feedback by ID
POST /maintenance/backfill-topics - Backfill topic field for old records
```

**TaskController.java** - `/admin/tasks/*`
```java
GET /tasks?status=TODO - List tasks by status
POST /tasks - Create new task
POST /tasks/{id}/done - Mark task complete with resolution note
POST /tasks/generate?onlyNegative=false - Auto-generate tasks
POST /tasks/{id}/assign - Assign task to owner
DELETE /tasks/{id} - Delete task
```

**ImplicitAnalyticsController.java** - `/admin/implicit/*`
```java
GET /analytics?sinceMinutes=60 - Page view analytics (p95, p99 dwell times)
GET /alerts?limit=20 - Recent high-priority tasks
POST /upload - Upload CSV of implicit behavior
  - Forwards to Orchestrator /implicit/import
  - Handles multipart/form-data or text/csv
  - Returns processed count and created feedback
```

**TrackingController.java** - `/tracking/page-view/*`
```java
POST /start - Start tracking page view
  Body: { sessionId, path, startAtMs?, uaHash?, ipHash? }
  Returns: { pageViewId }

POST /heartbeat - Update heartbeat timestamp
  Body: { pageViewId, tsMs }

POST /end - End page view tracking
  Body: { pageViewId, endAtMs?, durationMs? }
```

**UserAdminController.java** - `/admin/users/*`
```java
GET /users - List all user profiles
GET /users/{id} - Get user profile by ID
GET /users/{id}/feedbacks - Get user's feedback history
  Query params: from, to, sentiment, topic
GET /users/by-email?email=x - Find user by email
GET /users/by-username?userName=x - Find user by username
```

**AgentController.java** - `/admin/agents/*`
```java
GET /digest/config - Get digest agent configuration
POST /digest/send - Send email digest (dryRun option)
  Body: { dryRun: boolean, onlyCriticalHigh: boolean, recipients: [] }
  Returns: { tasksConsidered, emailsSent, runAt }

POST /followup/run - Run follow-up reminder agent
  Returns: { reminded, escalated }

POST /assignment/auto - Auto-assign tasks
  Body: { onlyCriticalHigh: boolean, pool: [] }
  Returns: { assigned, considered }

GET /sla/config - Get SLA monitoring config
POST /sla/run - Run SLA monitoring
  Body: { dryRun: boolean }
  Returns: { considered, reminded, escalated, dryRun, runAt }
```

**NotifyController.java** - `/admin/notify`
```java
POST / - Send notification email
  Body: { to: string, subject: string, body: string }
  Returns: { status: "sent", to } or { error }
```

**EmailAgentController.java** - `/agent/email/*`
```java
POST /force-run - Force email agent to run immediately
POST /test-connection - Test Gmail IMAP connection
POST /send-test-email - Send test email
```

#### Services

**FeedbackService.java**
```java
Key Methods:
- saveFeedback(Feedback) - Save with sentiment analysis and agent processing
  1. Attach user profile (find/create by email)
  2. Call ML service for sentiment analysis
  3. Save to database
  4. Trigger FeedbackAgentService

- performSentimentAnalysis(Feedback) - Call ML service /analyze
  Sets sentimentLabel, sentimentScore, topic

- attachUserProfile(Feedback) - Link or create UserProfile
  Finds by email, or creates new if not exists

- getAllFeedback(), updateFeedback(), deleteFeedbackById()
- saveFeedbackWithTimeoutControl() - Fast save with 3s timeout
```

**TaskService.java**
```java
- createTaskForFeedback(feedbackId, title, desc, assignedTo)
- listByStatus(status) - Filter tasks
- markDone(id, resolutionNote) - Complete task
- generateTasks(onlyNegative) - Auto-create tasks for negative feedback
- assign(id, owner) - Assign task to owner
```

**FeedbackAgentService.java**
```java
@Async method processFeedback(Feedback):
- Check if feedback is negative (rating <= 2)
- Auto-create HIGH priority task
- Send notification email to admins
```

**EmailService.java**
```java
- sendHtmlEmail(to, subject, htmlBody)
- sendSimpleEmail(to, subject, text)
Uses Spring Boot Mail with SMTP configuration
```

**UserProfileService.java**
```java
- findOrCreateByEmail(email, userName, customerName)
- Ensures unique UserProfile per email
- Used by FeedbackService.attachUserProfile()
```

**TrackingService.java**
```java
- startPageView(sessionId, path, ...) - Create PageView record
- heartbeat(pageViewId) - Update last seen
- endPageView(pageViewId, endAtMs, durationMs) - Calculate duration
- getAnalytics(sinceMinutes) - Compute p95, p99 by path
```

#### Agents

**EmailReviewAgent.java** (Currently open in editor)
```java
@Component - Spring-managed bean
@Scheduled(fixedDelayString = "${app.emailAgent.pollInterval:60000}")

Functionality:
1. Connects to Gmail IMAP inbox
2. Searches for UNREAD messages
3. Parses email body with FeedbackEmailParser
4. Extracts: Name, Email, ProductId, Rating, Comment
5. If complete: saves feedback, replies with acknowledgment
6. If incomplete: replies with template asking for missing fields
7. Marks email as SEEN

Configuration:
- SMTP_USERNAME, SMTP_PASSWORD (Gmail app password)
- EMAIL_IMAP_HOST, EMAIL_IMAP_PORT
- EMAIL_REQUIRED_FIELDS (comma-separated list)
```

**FeedbackEmailParser.java**
```java
Static utility methods:
- parseEmailBody(body) -> Map<String, String>
- Uses regex patterns to extract fields from email text
- Handles various formats (Name:, Rating:, etc.)
- extractRating() - Finds 1-5 number
- extractName() - Finds capitalized names
- extractEmail() - Validates email format
- extractProductId() - Parses product reference
- extractComment() - Captures feedback text
```

**EmailDigestAgent** (Scheduled)
```java
@Scheduled(cron = "${app.digestAgent.cron:0 0 8 * * MON-FRI}")
- Runs every weekday at 8 AM
- Gathers TODO/IN_PROGRESS tasks
- Groups by priority
- Sends summary email to configured recipients
- Supports dryRun mode for testing
```

**SLAAgent** (Scheduled)
```java
@Scheduled(cron = "${app.slaAgent.cron:0 */30 * * * *}")
- Runs every 30 minutes
- Monitors tasks approaching/exceeding SLA deadlines
- SLA windows: CRITICAL (2h), HIGH (8h), MEDIUM (24h), LOW (72h)
- Sends reminder emails for overdue tasks
- Escalates to management if severely overdue
```

#### Configuration

**WebConfig.java**
```java
@Configuration
- CORS configuration for frontend origins
- Allows credentials, max age 3600s
```

**SecurityConfig.java**
```java
@Configuration
- Disables CSRF for API endpoints
- Permits all requests (no authentication required)
- Can be extended for JWT/OAuth
```

**GoogleCalendarConfig.java**
```java
- Google OAuth configuration
- Client ID, Client Secret, Redirect URI
- Used by GoogleAuthController
```

#### Repositories (Spring Data JPA)

**FeedbackRepository.java**
```java
extends JpaRepository<Feedback, Long>
Custom queries:
- findByRating(int rating)
- findByServiceCategory(String category)
- findByCreatedAtBetween(Timestamp start, Timestamp end)
- findByUserProfile(UserProfile profile)
- findByUserProfileOrderByCreatedAtDesc(UserProfile profile)
- findByUserProfileAndCreatedAtBetween(...)
- findBySentimentLabelContainingIgnoreCase(String sentiment)
- findByTopicContainingIgnoreCase(String topic)
```

**UserProfileRepository.java**
```java
- findByEmail(String email)
- findByUserName(String userName)
```

**TaskRepository.java**
```java
- findByStatus(String status)
- findByFeedbackId(Long feedbackId)
- findByAssignedTo(String assignedTo)
- findByPriority(String priority)
```

**PageViewRepository.java**
```java
- findBySessionId(String sessionId)
- findByPathAndCreatedAtAfter(String path, Timestamp after)
```

---

### 4.3 Orchestrator (FastAPI + LangGraph)

**Container**: `orchestrator`
**Port**: 5050

**app.py** - Main FastAPI application

#### Endpoints

```python
GET /health
Returns: { "status": "healthy", "service": "orchestrator" }

POST /orchestrate
Request: { sessionId: str, messages: [{ role, content }] }
Response: { reply: str, state: dict }
Purpose: Chat-based feedback collection with multi-agent orchestration

POST /implicit/import
Request: { sessions: [SessionEvent] } or [SessionEvent]
SessionEvent: {
  userId?, pageUrl, pageTitle?, timeSpentSeconds, 
  clickCount?, scrollDepthPercent?, timestamp?,
  deviceType?, browser?, sessionId?, additionalNotes?
}
Response: { created: [], processed: int }
Purpose: Import implicit behavior data from CSV, classify, create feedback & tasks
```

#### Agent Architecture (LangGraph StateGraph)

**Flow**: intake → enrich → triage → priority → persist → task → END

**IntakeAgent** (agents/intake_agent.py)
```python
Purpose: Collect required fields (name, email, rating, feedback)
Logic:
- Checks state for missing fields
- Prompts user for first missing field
- Returns state with "next": "enrich" when complete
```

**EnrichmentAgent** (agents/enrichment_agent.py)
```python
Purpose: Call ML service to analyze sentiment
Logic:
- Posts feedback text to ML_URL/analyze
- Sets sentimentLabel, sentimentScore, topic in state
- Handles ML service errors gracefully
```

**TriageAgent** (agents/triage_agent.py)
```python
Purpose: Determine service category and channel
Logic:
- Uses LLM or rule-based classification
- Maps feedback to Universal service categories
- Infers channel (Chatbot, Online, Branch, etc.)
```

**PriorityAgent** (agents/priority_agent.py)
```python
Purpose: Assign task priority based on sentiment and rating
Logic:
- CRITICAL: rating 1 and negative sentiment
- HIGH: rating 1-2
- MEDIUM: rating 3
- LOW: rating 4-5
```

**PersistNode** (in app.py)
```python
Purpose: Save feedback to backend
Logic:
- Maps state to Feedback JSON
- POST to BACKEND_URL/feedback/submit
- Stores persistResult and feedbackId in state
```

**TaskAgent** (agents/task_agent.py)
```python
Purpose: Create admin task for follow-up
Logic:
- POST to BACKEND_URL/admin/tasks
- Body: { feedbackId, title, description, assignedTo }
- Priority-based title: "[CRITICAL] Customer Issue" etc.
```

**ImplicitAgent** (agents/implicit_agent.py)
```python
Purpose: Process implicit behavior data from CSV
Logic:
- Classifies each session (positive/negative/neutral)
- Extracts insights from browsing patterns
- Creates feedback entries for each session
- Generates tasks for concerning patterns
```

#### Tools

```python
async def call_ml_analyze(text: str)
- HTTP POST to ML_URL/analyze
- Returns { label, score, topic }

async def persist_feedback(feedback: dict)
- HTTP POST to BACKEND_URL/feedback/submit
- Returns saved Feedback entity
```

---

### 4.4 ML Service (FastAPI + Transformers)

**Container**: `feedback-ml-service`
**Port**: 5000

**sentiment_service.py** (or enhanced_sentiment_service.py)

#### Endpoints

```python
GET /health
Returns: { "status": "healthy" }

POST /analyze
Request: { "text": str }
Response: {
  "label": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "score": float (0.0-1.0),
  "topic": str
}
```

#### ML Models

**Sentiment Classification**
```python
Model: distilbert-base-uncased-finetuned-sst-2-english (Hugging Face)
Pipeline: text-classification
Output: POSITIVE/NEGATIVE with confidence score
Threshold: >0.6 for confident labels, else NEUTRAL
```

**Topic Extraction**
```python
Model: facebook/bart-large-mnli (Zero-shot classification)
Candidate labels: [
  "Account Services", "Loan Services", "Investment Services",
  "Digital Banking", "Customer Service", "Credit Cards", "Other"
]
Returns: Most likely topic based on text content
```

#### Mock Mode
```python
When ML_MODE=mock (default for fast startup):
- Returns random sentiment labels
- Returns random topics from predefined list
- No model loading (instant startup)
- Useful for development/testing
```

---

### 4.5 Chatbot API (Node.js Express)

**Container**: `chatbot-api`
**Port**: 4002

**app.js** - Main Express server

#### Endpoints

```javascript
GET /health
Returns: { 
  status: "healthy", 
  service: "Universal Chatbot Service",
  aiService: "orchestrator" | "huggingface",
  timestamp 
}

POST /message (via routes/chatRoutes.js)
Request: { sessionId: str, message: str }
Response: { 
  reply: str, 
  feedbackSubmitted: boolean,
  feedbackId?: number
}
```

#### Controllers

**chatController.js** (via controllers/chatController.js)
```javascript
Modes (based on AI_SERVICE env var):
1. orchestrator mode (default):
   - Forwards to ORCHESTRATOR_URL/orchestrate
   - Maintains conversation history
   - Returns AI-generated responses
   
2. mock mode:
   - Uses mockChatController
   - Simple pattern matching
   - Returns canned responses
   
3. huggingface mode:
   - Forwards to HUGGINGFACE_URL/chat
   - Simulates LLM responses
```

**huggingfaceChatController.js**
```javascript
Purpose: Interface with Python HF service
- Builds conversation history
- Posts to chatbot-hf:5001/chat
- Handles timeout/retry logic
```

---

### 4.6 HF-like Chat Service (Python Flask)

**Container**: `chatbot-hf`
**Port**: 5001

**services/huggingfaceService.py**

```python
EnhancedUniversalAssistant class:

extract_info_from_conversation(messages):
- Parses full conversation history
- Extracts: name, email, rating, service category, channel
- Uses regex patterns for data extraction

extract_name(text):
- Patterns: "i'm", "my name is", "call me"
- Validates against common words list

extract_email(text):
- Regex for valid email format
- Returns first match

extract_rating(text):
- Looks for numbers 1-5
- Phrases: "rate 4", "5 stars", "1/5"

extract_service_category(text):
- Keywords: "loan", "investment", "account", "mobile banking"
- Maps to category list

generate_response(conversation_state, user_message):
- State machine for conversation flow
- Guides user through feedback collection
- Returns appropriate prompts
```

---

## 5. Database Schema

### Tables

#### feedback
```sql
CREATE TABLE feedback (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  feedback TEXT,
  service_category VARCHAR(100),
  service_channel VARCHAR(100),
  customer_type VARCHAR(100),
  business_unit VARCHAR(100),
  rating INT DEFAULT 5,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  comment TEXT,
  product_id BIGINT DEFAULT 1,
  sentiment_label VARCHAR(50),
  sentiment_score DOUBLE,
  topic VARCHAR(255),
  user_profile_id BIGINT,
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id),
  INDEX idx_customer_name (customer_name),
  INDEX idx_service_category (service_category),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at)
);
```

#### user_profiles
```sql
CREATE TABLE user_profiles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  user_name VARCHAR(255),
  customer_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_profiles_email (email)
);
```

#### feedback_tasks
```sql
CREATE TABLE feedback_tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  feedback_id BIGINT,
  title VARCHAR(255),
  description TEXT,
  priority VARCHAR(50) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'TODO',
  assigned_to VARCHAR(255),
  resolution_note TEXT,
  due_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
);
```

#### page_views
```sql
CREATE TABLE page_views (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255),
  path VARCHAR(500),
  start_at_ms BIGINT,
  end_at_ms BIGINT,
  duration_ms BIGINT,
  ua_hash VARCHAR(100),
  ip_hash VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (session_id),
  INDEX idx_path_created (path, created_at)
);
```

---

## 6. API Endpoints Summary

### Backend (Port 8085)

**Health & Dashboard**
- GET `/health` → "OK"
- GET `/api/health` → "OK"
- GET `/api/dashboard` → DashboardResponse

**Feedback**
- POST `/feedback/submit` → Feedback
- POST `/feedback/submit-fast` → Feedback
- GET `/feedback/ml-status` → { mlServiceAvailable, message }
- GET `/feedback/all` → Feedback[]
- DELETE `/feedback/{id}` → string
- PUT `/feedback/{id}` → Feedback

**Tracking**
- POST `/tracking/page-view/start` → { pageViewId }
- POST `/tracking/page-view/heartbeat` → { ok: true }
- POST `/tracking/page-view/end` → { ok: true }

**Admin - Core**
- GET `/admin/analytics` → Map
- GET `/admin/feedbacks` → Feedback[]
- GET `/admin/feedback/{id}` → Feedback
- POST `/admin/maintenance/backfill-topics` → Map

**Admin - Implicit**
- GET `/admin/implicit/analytics?sinceMinutes=60` → Analytics
- GET `/admin/implicit/alerts?limit=20` → Task[]
- POST `/admin/implicit/upload` → { processed, created }

**Admin - Tasks**
- GET `/admin/tasks?status=TODO` → TaskDto[]
- POST `/admin/tasks` → TaskDto
- POST `/admin/tasks/{id}/done` → TaskDto
- POST `/admin/tasks/generate` → Map
- POST `/admin/tasks/{id}/assign` → TaskDto
- DELETE `/admin/tasks/{id}` → 204

**Admin - Agents**
- GET `/admin/agents/digest/config` → Config
- POST `/admin/agents/digest/send` → { tasksConsidered, emailsSent }
- POST `/admin/agents/followup/run` → { reminded, escalated }
- POST `/admin/agents/assignment/auto` → { assigned, considered }
- GET `/admin/agents/sla/config` → Config
- POST `/admin/agents/sla/run` → { considered, reminded, escalated }

**Admin - Users**
- GET `/admin/users` → UserProfile[]
- GET `/admin/users/{id}` → UserProfile
- GET `/admin/users/{id}/feedbacks` → Feedback[]
- GET `/admin/users/by-email?email=x` → UserProfile
- GET `/admin/users/by-username?userName=x` → UserProfile

**Admin - Notify**
- POST `/admin/notify` → { status, to }

### Orchestrator (Port 5050)
- GET `/health` → { status, service }
- POST `/orchestrate` → { reply, state }
- POST `/implicit/import` → { created, processed }

### ML Service (Port 5000)
- GET `/health` → { status }
- POST `/analyze` → { label, score, topic }

### Chatbot (Port 4002)
- GET `/health` → { status, service, aiService }
- POST `/message` → { reply, feedbackSubmitted?, feedbackId? }

---

## 7. Code Structure

### Backend Java Package Structure
```
com.universal.feedback/
├── Application.java              # Main Spring Boot application
├── WebConfig.java                # CORS configuration
├── SecurityConfig.java           # Security settings
├── GoogleCalendarConfig.java     # OAuth config
├── GoogleAuthController.java     # OAuth endpoints
├── model/                        # JPA Entities
│   ├── Feedback.java
│   ├── UserProfile.java
│   ├── FeedbackTask.java
│   ├── PageView.java
│   └── TestEntity.java
├── repository/                   # Spring Data JPA Repositories
│   ├── FeedbackRepository.java
│   ├── UserProfileRepository.java
│   ├── TaskRepository.java
│   └── PageViewRepository.java
├── service/                      # Business Logic
│   ├── FeedbackService.java
│   ├── TaskService.java
│   ├── EmailService.java
│   ├── UserProfileService.java
│   ├── TrackingService.java
│   └── FeedbackAgentService.java
├── controller/                   # REST Controllers
│   ├── FeedbackController.java
│   └── TrackingController.java
├── admin/                        # Admin Controllers
│   ├── AdminDashboardController.java
│   ├── TaskController.java
│   ├── ImplicitAnalyticsController.java
│   ├── UserAdminController.java
│   ├── AgentController.java
│   ├── AnalyticsController.java
│   ├── NotifyController.java
│   └── TaskDto.java
├── agents/                       # Agent Services
│   ├── EmailReviewAgent.java
│   ├── EmailAgentController.java
│   └── FeedbackEmailParser.java
└── exception/                    # Exception Handlers
    └── GlobalExceptionHandler.java
```

### Frontend React Component Structure
```
src/
├── App.js                        # Root with routing
├── api.js                        # Axios API client
├── index.js                      # ReactDOM render
├── components/
│   ├── RootFeedbackComponent.js  # Home page
│   ├── EnhancedFeedbackForm.js   # Main feedback form
│   ├── FeedbackList.js           # List view
│   ├── Dashboard.js              # Public analytics
│   ├── FeedbackHistory.js        # Filtered history
│   ├── AdminDashboard.js         # Admin panel
│   ├── AdminUsers.js             # User management
│   ├── AdminAgents.js            # Agent controls
│   └── ChatbotComponent.js       # Floating chat
└── utils/
    └── pageTracker.js            # Page view tracking
```

### Orchestrator Python Structure
```
orchestrator/
├── app.py                        # FastAPI main
├── agents/
│   ├── __init__.py               # Agent exports
│   ├── intake_agent.py           # Field collection
│   ├── enrichment_agent.py       # Sentiment analysis
│   ├── triage_agent.py           # Category assignment
│   ├── priority_agent.py         # Priority calculation
│   ├── task_agent.py             # Task creation
│   ├── implicit_agent.py         # CSV import processing
│   ├── scheduler_agent.py        # Scheduled feedback
│   └── notifier_agent.py         # Notifications
└── requirements.txt
```

---

## 8. Key Features Explained

### 8.1 Multi-Channel Feedback Collection

**1. Web Form (Direct)**
- User fills EnhancedFeedbackForm
- POST to /feedback/submit
- Instant save to database
- ML analysis on submit

**2. Chatbot (Conversational)**
- User chats with bot
- Orchestrator extracts fields from conversation
- When complete: submits feedback automatically
- Creates task for follow-up

**3. Email (Automated)**
- User sends email to configured address
- EmailReviewAgent polls IMAP inbox every 60s
- Parses email body for feedback fields
- Replies if fields missing (template)
- Saves and acknowledges when complete

**4. CSV Import (Bulk)**
- Admin uploads CSV of implicit behavior
- ImplicitAgent classifies each session
- Creates feedback + tasks in batch
- Returns summary of created records

### 8.2 Sentiment Analysis Pipeline

**Flow**:
```
Feedback Text
    ↓
ML Service (/analyze)
    ↓
Transformer Model (DistilBERT)
    ↓
{ label: POSITIVE/NEGATIVE/NEUTRAL, score: 0.85, topic: "Digital Banking" }
    ↓
Stored in Feedback entity
    ↓
Used for analytics & task priority
```

**Implementation**:
```java
// FeedbackService.java
private void performSentimentAnalysis(Feedback feedback) {
    if (feedback.getFeedback() == null) return;
    
    Map<String, String> payload = Map.of("text", feedback.getFeedback());
    ResponseEntity<Map> resp = restTemplate.postForEntity(
        mlAnalyzeUrl, payload, Map.class
    );
    
    feedback.setSentimentLabel((String) resp.getBody().get("label"));
    feedback.setSentimentScore((Double) resp.getBody().get("score"));
    feedback.setTopic((String) resp.getBody().get("topic"));
}
```

### 8.3 User Profile Linking

**Purpose**: Track all feedback from same customer

**Logic**:
```java
// FeedbackService.attachUserProfile()
private void attachUserProfile(Feedback feedback) {
    String email = determineEmail(feedback); // userEmail or email field
    if (email == null) return;
    
    UserProfile profile = userProfileService.findOrCreateByEmail(
        email, 
        feedback.getUserName(), 
        feedback.getCustomerName()
    );
    
    feedback.setUserProfile(profile);
}
```

**Benefits**:
- View all feedback from one customer
- Track customer journey
- Identify repeat issues
- Personalize follow-up

### 8.4 Automated Task Generation

**Triggers**:
1. **On negative feedback** (rating ≤ 2)
2. **On CSV import** (concerning patterns)
3. **Manual via /admin/tasks/generate**

**Priority Assignment**:
```java
// PriorityAgent logic
if (rating == 1 && sentiment == "NEGATIVE") → CRITICAL
else if (rating <= 2) → HIGH
else if (rating == 3) → MEDIUM
else → LOW
```

**Task Content**:
```java
Task title: "[CRITICAL] Customer Issue - {topic}"
Description: "{customerName} ({email}) reported:\n{feedback}\n\nSentiment: {label} ({score})"
AssignedTo: Auto-assigned or manual
DueAt: Based on SLA window
```

### 8.5 Agent Automation

**Email Digest Agent**
- **Schedule**: Every weekday 8 AM
- **Purpose**: Daily task summary for team
- **Content**: Groups tasks by priority, includes links
- **Recipients**: Configurable list

**SLA Monitoring Agent**
- **Schedule**: Every 30 minutes
- **Purpose**: Ensure tasks handled on time
- **SLA Windows**:
  - CRITICAL: 2 hours
  - HIGH: 8 hours
  - MEDIUM: 24 hours
  - LOW: 72 hours
- **Actions**: Reminder emails, escalation to management

**Follow-up Agent**
- **Trigger**: Manual via /admin/agents/followup/run
- **Purpose**: Remind task owners of pending work
- **Logic**: Finds IN_PROGRESS tasks older than threshold

**Auto-Assignment Agent**
- **Trigger**: Manual via /admin/agents/assignment/auto
- **Purpose**: Distribute tasks to team
- **Logic**: Round-robin from configured pool

### 8.6 Page Tracking & Analytics

**Frontend Tracking**:
```javascript
// utils/pageTracker.js
startTracking(path) {
  const sessionId = getOrCreateSession();
  POST /tracking/page-view/start → pageViewId
  
  // Heartbeat every 30s
  setInterval(() => {
    POST /tracking/page-view/heartbeat { pageViewId }
  }, 30000);
}

endTracking() {
  POST /tracking/page-view/end { pageViewId, endAtMs, durationMs }
}
```

**Backend Analytics**:
```java
// TrackingService.getAnalytics()
public List<PathAnalytics> getAnalytics(int sinceMinutes) {
    List<PageView> views = repo.findByCreatedAtAfter(cutoff);
    
    Map<String, List<Long>> byPath = groupByPath(views);
    
    return byPath.entrySet().stream().map(e -> {
        List<Long> durations = e.getValue().sorted();
        return new PathAnalytics(
            path: e.getKey(),
            count: durations.size(),
            p95: percentile(durations, 0.95),
            p99: percentile(durations, 0.99)
        );
    });
}
```

**Use Cases**:
- Identify pages with high dwell times
- Detect usability issues
- Optimize user experience
- Create implicit feedback from behavior

---

## 9. Data Flows

### 9.1 Explicit Feedback Flow
```
User fills form
    ↓
POST /feedback/submit
    ↓
FeedbackController.submitFeedback()
    ↓
FeedbackService.saveFeedback()
    ├─ attachUserProfile() → Find/create UserProfile
    ├─ performSentimentAnalysis() → ML Service
    ├─ repository.save() → MySQL
    └─ feedbackAgentService.processFeedback() → Auto-create task if negative
    ↓
Return saved Feedback to UI
    ↓
UI shows success message
```

### 9.2 Chatbot Feedback Flow
```
User: "I want to give feedback"
    ↓
POST /message → Chatbot API
    ↓
POST /orchestrate → Orchestrator
    ↓
IntakeAgent: "What's your name?"
User: "John Doe"
    ↓
IntakeAgent: "What's your email?"
User: "john@example.com"
    ↓
IntakeAgent: "Rate your experience 1-5"
User: "2"
    ↓
IntakeAgent: "Tell us what happened"
User: "App keeps crashing"
    ↓
EnrichmentAgent: Call ML Service → "NEGATIVE, 0.92, Mobile App"
    ↓
TriageAgent: serviceCategory = "Digital Banking", channel = "Chatbot"
    ↓
PriorityAgent: priority = "HIGH" (rating 2)
    ↓
PersistNode: POST /feedback/submit → Save to DB
    ↓
TaskAgent: POST /admin/tasks → Create HIGH priority task
    ↓
Return: "Thank you! Your feedback has been submitted. ID: #123"
```

### 9.3 CSV Import Flow
```
Admin uploads CSV file
    ↓
POST /admin/implicit/upload (multipart/form-data)
    ↓
Backend parses CSV → Extract sessions
    ↓
POST /implicit/import → Orchestrator
    ↓
ImplicitAgent processes each session:
  - Classify as positive/negative/neutral
  - Extract insights from behavior
  ↓
For each session:
  - POST /feedback/submit → Create Feedback
  - POST /admin/tasks → Create Task if concerning
  ↓
Return: { processed: 50, created: [feedback1, feedback2, ...] }
    ↓
UI shows summary: "Processed 50 sessions, created 50 feedbacks"
```

### 9.4 Email Feedback Flow
```
User sends email to venkatmariserla001@gmail.com
    ↓
EmailReviewAgent polls IMAP every 60s
    ↓
Finds UNREAD email
    ↓
FeedbackEmailParser.parseEmailBody()
    ↓
Check required fields: Name, Email, Rating, Comment
    ↓
If COMPLETE:
  - POST /feedback/submit → Save feedback
  - Reply with acknowledgment
  - Mark email as SEEN
    ↓
If INCOMPLETE:
  - Reply with template asking for missing fields
  - Do NOT mark as SEEN (will retry on next poll)
```

### 9.5 User History Flow
```
Admin: "Show me all feedback from john@example.com"
    ↓
GET /admin/users/by-email?email=john@example.com
    ↓
UserAdminController.findByEmail()
    ↓
Return UserProfile { id: 5, email: "john@example.com", ... }
    ↓
GET /admin/users/5/feedbacks?from=2025-01-01&sentiment=negative
    ↓
UserAdminController.getUserFeedbacks()
    ↓
FeedbackRepository.findByUserProfileAndCreatedAtBetween(...)
    ↓
Filter by sentiment, topic
    ↓
Return List<Feedback>
    ↓
UI displays timeline of user's feedback
```

---

## 10. Deployment

### 10.1 Docker Compose (Development)

**Start all services**:
```powershell
cd Universal-Feedback-System
docker compose up -d --build
```

**Stop services**:
```powershell
docker compose down
```

**View logs**:
```powershell
docker compose logs -f backend
docker compose logs -f orchestrator
```

**Rebuild specific service**:
```powershell
docker compose up -d --build backend
```

### 10.2 Environment Variables

**Backend (.env or docker-compose.yml)**:
```bash
MYSQL_DATABASE=universal_feedback
MYSQL_USER=universal_user
MYSQL_PASSWORD=universal_pass123
MYSQL_PORT=3307

SPRING_PROFILES_ACTIVE=docker
ML_SERVICE_URL=http://ml-service:5000

# Email agent (Gmail)
SMTP_USERNAME=venkatmariserla001@gmail.com
SMTP_PASSWORD=<app-password>
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993

# Google OAuth
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_REFRESH_TOKEN=<token>

# Frontend URL for email links
APP_UI_BASE_URL=http://localhost:3000
```

**Frontend (.env)**:
```bash
REACT_APP_API_URL=http://localhost:8085
REACT_APP_ML_SERVICE_URL=http://localhost:5000
REACT_APP_CHATBOT_URL=http://localhost:4002
```

**Orchestrator (.env)**:
```bash
BACKEND_URL=http://backend:8085
ML_URL=http://ml-service:5000
```

**Chatbot (.env)**:
```bash
PORT=4002
AI_SERVICE=orchestrator
ORCHESTRATOR_URL=http://orchestrator:5050
BACKEND_BASE_URL=http://backend:8085
HUGGINGFACE_URL=http://chatbot-hf:5001
FRONTEND_URL=http://localhost:3000
```

### 10.3 Kubernetes (Production)

**Manifests** in `/k8s/` directory:
- `mysql-deployment.yaml` - StatefulSet with PVC
- `backend-deployment.yaml` - Spring Boot pods
- `frontend-deployment.yaml` - Nginx pods
- `orchestrator-deployment.yaml` - FastAPI pods
- `ml-service-deployment.yaml` - ML pods
- `chatbot-deployment.yaml` - Node pods
- `ingress.yaml` - External access rules

**Deploy**:
```bash
kubectl apply -f k8s/
kubectl get pods -n universal-feedback
```

### 10.4 CI/CD Pipeline (Jenkins)

**Jenkinsfile** in `/jenkins/JenkinsFile`:
```groovy
Pipeline stages:
1. Checkout - Git clone
2. Build Backend - Maven build
3. Build Frontend - npm build
4. Build Orchestrator - pip install
5. Build ML Service - pip install
6. Docker Build - Build all images
7. Docker Push - Push to registry
8. Deploy - kubectl apply
9. Test - Run integration tests
10. Notify - Slack/Email notification
```

---

## 11. Testing

### Backend Tests
```bash
cd backend
./mvnw test
```

**Test Structure**:
- `src/test/java/com/universal/feedback/`
  - `controller/` - REST endpoint tests (MockMvc)
  - `service/` - Business logic tests (Mockito)
  - `repository/` - Data access tests (H2 in-memory)

### Frontend Tests
```bash
cd frontend/feedback-frontend
npm test
```

**Test Files**:
- `App.test.js` - Component rendering
- `setupTests.js` - Jest configuration

### Integration Tests
```bash
cd orchestrator
pytest
```

---

## 12. Troubleshooting

### Common Issues

**Backend won't start**:
- Check MySQL is running: `docker ps | grep mysql`
- Verify DB credentials in docker-compose.yml
- Check logs: `docker compose logs backend`

**ML Service timeout**:
- First call takes 30s+ (model loading)
- Use mock mode: `ML_MODE=mock`
- Increase backend timeout in FeedbackService

**Chatbot not responding**:
- Verify orchestrator health: `curl http://localhost:5050/health`
- Check AI_SERVICE env var in chatbot container
- Review chatbot logs: `docker compose logs chatbot`

**CSV upload fails**:
- Check file size (<10MB)
- Verify CSV format (headers: userId, pageUrl, timeSpentSeconds, ...)
- Ensure orchestrator is reachable from backend

**Email agent not working**:
- Generate Gmail App Password (not regular password)
- Enable IMAP in Gmail settings
- Check SMTP_USERNAME and SMTP_PASSWORD env vars
- Verify EMAIL_IMAP_HOST and EMAIL_IMAP_PORT

---

## 13. Future Enhancements

### Planned Features
1. **Real-time notifications** - WebSocket for live updates
2. **Advanced analytics** - Trend analysis, predictive models
3. **Multi-language support** - i18n for global reach
4. **Mobile app** - React Native frontend
5. **Voice feedback** - Speech-to-text integration
6. **File attachments** - Screenshots, documents
7. **Admin roles** - RBAC with permissions
8. **Export reports** - PDF, Excel generation
9. **API rate limiting** - Prevent abuse
10. **Audit logging** - Track all admin actions

---

## 14. Contributing

### Development Workflow
1. Clone repo: `git clone <repo-url>`
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes and test locally
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

### Code Standards
- **Java**: Google Java Style Guide
- **JavaScript**: ESLint with Airbnb config
- **Python**: PEP 8 with Black formatter
- **Documentation**: Update README for new features

---

## 15. Support

### Documentation
- [Architecture](./docs/ARCHITECTURE.md)
- [APIs](./docs/APIs.md)
- [Setup](./docs/SETUP.md)
- [Operations](./docs/OPERATIONS.md)

### Contact
- **Project Lead**: Venkat Mariserla
- **Email**: venkatmariserla001@gmail.com
- **Repository**: [GitHub Link]

---

**Last Updated**: December 28, 2025
**Version**: 1.0.0
