# End-to-End Dataflows

This document shows the main journeys across services with sequence summaries.

## 1) Explicit Feedback Submission

- Frontend → Backend `/feedback/submit` → DB
- Dashboard reads metrics from Backend `/api/dashboard`

Sequence (conceptual):

1. User submits form in UI
2. Frontend POST `API_BASE/feedback/submit` with Feedback JSON
3. Backend persists to MySQL and returns saved entity
4. Frontend shows confirmation, can navigate to insights

## 2) Implicit Behavior Import (CSV)

- Frontend Admin → Backend `/admin/implicit/upload` → Orchestrator `/implicit/import`
- Orchestrator → Backend `/feedback/submit` + `/admin/tasks` (+ `/admin/notify` optional)
- Frontend updates Snackbar with result, reloads analytics (`/admin/implicit/analytics`, `/admin/implicit/alerts`)

Sequence:

1. Admin selects CSV and clicks Upload
2. Backend parses CSV, builds `{ sessions: [...] }`, forwards to Orchestrator
3. Orchestrator classifies each session
4. For each session: create Feedback, create Task, maybe Notify
5. Orchestrator responds `{ processed, created: [...] }`
6. Backend forwards response; UI shows summary

## 3) Chatbot-Assisted Feedback

- UI Chat → Chatbot `/message`
  - If `AI_SERVICE=orchestrator`: Chatbot → Orchestrator `/orchestrate` → Backend `/feedback/submit`
  - Else: Chatbot → HF-like `/chat` (current controller mocks backend persistence on function call)

Sequence:

1. User sends message(s) to chatbot
2. Chatbot calls Orchestrator with conversation history
3. Orchestrator extracts name/email/rating/feedback
4. Orchestrator persists feedback, creates task, returns reply
5. Chatbot relays reply to UI

## 4) Sentiment/Topic Analysis

- Backend/Orchestrator → ML Service `/analyze`
- Classification is used to enrich feedback records (label, score, topic)

## 5) Tracking & Analytics

- Frontend posts page-view events to `/tracking/page-view/*`
- Backend computes p95/p99 by path and exposes `/admin/implicit/analytics`
- Admin views recent alerts from `/admin/implicit/alerts`
