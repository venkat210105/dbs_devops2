# DBS Feedback System - Architecture

This document provides a complete view of the system components, key responsibilities, APIs by service, and the end-to-end dataflows.

## Components Overview

- Frontend (React + MUI)
  - Container: `dbs-feedback-frontend`
  - Port: 3000 (host) → Nginx 80 (container)
  - Talks to Backend via `REACT_APP_API_URL` or `/api` proxy. In dev, defaults to `http://localhost:8085`.

- Backend (Spring Boot 3.x, Java 21)
  - Container: `dbs-feedback-backend`
  - Port: 8085
  - Responsibilities: feedback CRUD, admin analytics, tasks, implicit CSV intake (forward to orchestrator), tracking events, health.

- Orchestrator (FastAPI + LangGraph)
  - Container: `dbs-orchestrator`
  - Port: 5050
  - Responsibilities: chat orchestration, implicit import processing, classification, calling backend & ML service.

- ML Service (FastAPI + Transformers)
  - Container: `dbs-feedback-ml-service`
  - Port: 5000
  - Responsibilities: sentiment and topic analysis.

- Chatbot API (Node/Express)
  - Container: `dbs-chatbot-api`
  - Port: 4002
  - Responsibilities: chat interface for web UI; proxies to Orchestrator or HF-like service.

- HF-like Chat Service (Python)
  - Container: `dbs-chatbot-hf`
  - Port: 5001
  - Responsibilities: mock/simplified LLM responses for chatbot.

- Database (MySQL 8)
  - Container: `dbs-feedback-mysql`
  - Port: 3307 (host) → 3306 (container)
  - Schema initialized via `database/init.sql`, additional JPA-managed tables.
  - Tables: `feedback`, `page_views`, `feedback_tasks`, and new `user_profiles` (feedback.user_profile_id FK)

- Network: `feedback-net` (Docker bridge)

## Ports & URLs

- Frontend: http://localhost:3000 (prod container serves via Nginx on 80)
- Backend: http://localhost:8085
- Orchestrator: http://localhost:5050
- ML Service: http://localhost:5000
- Chatbot API: http://localhost:4002
- HF-like: http://localhost:5001
- MySQL: localhost:3307

## High-Level Dataflows

1. Feedback Submission (explicit)
   - User → Frontend → Backend `/feedback/submit` → DB
   - Dashboard & analytics read from backend.

2. Implicit Behavior Import (CSV)
   - Admin uploads CSV in UI → Backend `/admin/implicit/upload` → Orchestrator `/implicit/import`
   - Orchestrator classifies, persists Feedbacks and creates Admin Tasks; optional notifications.

3. Chatbot-Assisted Feedback
   - UI → Chatbot `/message` → (orchestrator mode) Orchestrator `/orchestrate` → Backend `/feedback/submit` → Task creation via agent.

4. Sentiment/Topic Analysis
   - Orchestrator/Backend invokes ML Service `/analyze` to classify text, used for enrichment.

5. Tracking & Analytics
6. User-wise History
  - On save/update, backend resolves/creates `UserProfile` by email (or names) and links `Feedback.user_profile_id`.
  - Admin can list users and fetch their feedback history via `/admin/users` and `/admin/users/{id}/feedbacks`.
   - UI → Backend `/tracking/page-view/*` to log dwell times → Admin views `/admin/implicit/analytics` and `/admin/implicit/alerts`.

---

See `APIs.md` for full endpoint catalog and request/response contracts.
