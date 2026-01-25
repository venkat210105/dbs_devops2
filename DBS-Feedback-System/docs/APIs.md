# APIs by Service

This document catalogs all REST endpoints exposed by each service, with request/response shapes and notes.

## Backend (Spring Boot, :8085)

 
### Health & Dashboard

- GET `/health` → "OK"
- GET `/api/health` → "OK"
- GET `/` → service banner
- GET `/api/dashboard` → `DashboardResponse` (aggregated metrics)

 
### Feedback

- POST `/feedback/submit`
  - Body: `Feedback`
  - Response: persisted `Feedback`
  - Notes: defaults rating=5, productId=1, userEmail fallback for implicit
- POST `/feedback/submit-fast` → `Feedback`
- GET `/feedback/ml-status` → `{ mlServiceAvailable: boolean, message: string }`
- GET `/feedback/all` → `Feedback[]`
- DELETE `/feedback/{id}` → `string`
- PUT `/feedback/{id}` → `Feedback`

 
### Tracking

- POST `/tracking/page-view/start`
  - Body: `{ sessionId, path, startAtMs?, uaHash?, ipHash? }`
  - Res: `{ pageViewId }`
- POST `/tracking/page-view/heartbeat`
  - Body: `{ pageViewId, tsMs }`
  - Res: `{ ok: true }`
- POST `/tracking/page-view/end`
  - Body: `{ pageViewId, endAtMs?, durationMs? }`
  - Res: `{ ok: true }`

 
### Admin - Core

- GET `/admin/analytics` → `Map`
- GET `/admin/feedbacks` → `Feedback[]`
- GET `/admin/feedback/{id}` → `Feedback | 404`
- POST `/admin/maintenance/backfill-topics` → `Map`

 
### Admin - Implicit

- GET `/admin/implicit/analytics?sinceMinutes=60`
  - Res: `{ sinceMinutes, perPath: [{ path, count, p95, p99 }] }`
- GET `/admin/implicit/alerts?limit=20`
  - Res: `[{ id, title, priority, status, createdAt, description }]`
- POST `/admin/implicit/upload`
  - Consumes: `multipart/form-data` (file) or raw `text/csv`
  - Res: `{ processed, created: any[] } | error`
  - Notes: forwards to Orchestrator `/implicit/import`, handles 404, 504

 
### Admin - Tasks

- GET `/admin/tasks?status=TODO` → `TaskDto[]`
- POST `/admin/tasks`
  - Body: `{ feedbackId, title, description, assignedTo }`
  - Res: `TaskDto` (201)
- POST `/admin/tasks/{id}/done`
  - Body: `{ resolutionNote? }`
  - Res: `TaskDto`
- POST `/admin/tasks/generate?onlyNegative=false` → `Map`
 - DELETE `/admin/tasks/{id}` → `204 No Content | 404 Not Found`

 
### Admin - Agents

- GET `/admin/agents/digest/config` → `{ enabled, cron, onlyCriticalHigh, defaultRecipients[], lastRun? }`
- POST `/admin/agents/digest/send`
  - Body: `{ dryRun?: boolean, onlyCriticalHigh?: boolean, recipients?: string[] }`
  - Res: `{ tasksConsidered, recipientsCount, emailsSent, dryRun, runAt }`
- POST `/admin/agents/followup/run` → `{ reminded, escalated }`
- POST `/admin/agents/assignment/auto`
  - Body: `{ onlyCriticalHigh?: boolean, pool?: string[] }`
  - Res: `{ assigned, considered }`
- GET `/admin/agents/sla/config`
  - Res: `{ enabled: boolean, cron: string, windows: { CRITICAL, HIGH, MEDIUM, LOW }, escalationRecipients: string[], lastRun? }`
- POST `/admin/agents/sla/run`
  - Body: `{ dryRun: boolean }`
  - Res: `{ considered, reminded, escalated, dryRun, runAt }`

PowerShell examples:

```powershell
# Digest dry-run
Invoke-RestMethod -Method POST -Uri http://localhost:8085/admin/agents/digest/send \
  -ContentType 'application/json' -Body (@{ dryRun = $true } | ConvertTo-Json -Compress)

# SLA dry-run
Invoke-RestMethod -Method POST -Uri http://localhost:8085/admin/agents/sla/run \
  -ContentType 'application/json' -Body (@{ dryRun = $true } | ConvertTo-Json -Compress)
```

curl examples:

```bash
curl -sS -X POST http://localhost:8085/admin/agents/digest/send \
  -H 'Content-Type: application/json' \
  -d '{"dryRun":true, "onlyCriticalHigh":false}'

curl -sS -X POST http://localhost:8085/admin/agents/sla/run \
  -H 'Content-Type: application/json' \
  -d '{"dryRun":true}'
```

 
### Admin - Users

- GET `/admin/users` → `UserProfile[]`
- GET `/admin/users/{id}` → `UserProfile | 404`
- GET `/admin/users/{id}/feedbacks` → `Feedback[]` from that user
  - Optional query params:
    - `from`: ISO date or datetime (e.g., `2025-01-01` or `2025-01-01T00:00:00Z`)
    - `to`: ISO date or datetime
    - `sentiment`: substring match against `sentimentLabel` (case-insensitive)
    - `topic`: substring match against `topic` (case-insensitive)
- GET `/admin/users/by-email?email=alice@example.com` → `UserProfile | 404`
- GET `/admin/users/by-username?userName=alice` → `UserProfile | 404`

 
### Admin - Notify

- POST `/admin/notify`
  - Body: `{ to, subject, body }`
  - Res: `{ status: "sent", to } | { error }`

 
### Google OAuth (demo)

- GET `/feedback/authorize`
- GET `/feedback/oauth2callback`
- GET `/feedback/refresh-token`

---

## Orchestrator (FastAPI, :5050)

- GET `/health` → `{ status: "healthy", service: "orchestrator" }`
- POST `/orchestrate`
  - Body: `{ sessionId: string, messages: {role, content}[] }`
  - Res: `{ reply: string, state: object }`
- POST `/implicit/import`
  - Body: `{ sessions: SessionEvent[] }` or `SessionEvent[]`
  - `SessionEvent`: `{ userId?, pageUrl, pageTitle?, timeSpentSeconds, clickCount?, scrollDepthPercent?, timestamp?, deviceType?, browser?, sessionId?, additionalNotes? }`
  - Res: `{ created: any[], processed: number }`

---

## ML Service (FastAPI, :5000)

- GET `/health`
- POST `/analyze`
  - Body: `{ text: string }`
  - Res: `{ label: string, score: number, topic: string }`

---

## Chatbot API (Node/Express, :4002)

- GET `/health` → `{ status, service, aiService, timestamp }`
- POST `/message`
  - Body: `{ sessionId, message }`
  - Behavior: routes to Orchestrator `/orchestrate` or HF-like `/chat`
  - Res: `{ reply, mode flags, feedbackId? }`

---

## HF-like Chat Service (:5001)

- GET `/health`
- POST `/chat` → OpenAI-like response payload (simulated)
