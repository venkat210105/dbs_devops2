# Configuration

This document lists key configuration entries and environment variables.

## Backend (Spring Boot)

- Database
  - `SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/dbs_feedback?...`
  - `SPRING_DATASOURCE_USERNAME=dbsuser`
  - `SPRING_DATASOURCE_PASSWORD=dbspass123`
  - `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
- Orchestrator forwarding
  - `orchestrator.url` (default `http://orchestrator:5050`)
  - `orchestrator.connect-timeout-ms=5000`
  - `orchestrator.read-timeout-ms=120000`
- Upload size
  - `spring.servlet.multipart.max-file-size=10MB`
  - `spring.servlet.multipart.max-request-size=10MB`

### Email Review Agent (Gmail)

The backend can automatically ingest customer reviews sent by email and create feedback records.

- Enable/disable
  - `app.emailAgent.enabled=true`
- Polling interval (ms)
  - `app.emailAgent.poll-interval-ms=60000`
- IMAP connection (defaults work for Gmail)
  - `EMAIL_IMAP_HOST=imap.gmail.com`
  - `EMAIL_IMAP_PORT=993`
  - `spring.mail.username` → Gmail address (e.g. `venkatmariserla001@gmail.com`)
  - `spring.mail.password` → App Password for the Gmail account (not your login password)
- Required fields to extract (comma-separated)
  - `EMAIL_REQUIRED_FIELDS=customerName,userEmail,productId,rating,comment`

Notes:

- For Gmail, create an App Password (Account → Security → 2‑Step Verification → App passwords) and set `spring.mail.username` and `spring.mail.password`.
- The agent polls the INBOX for unread emails. If required fields are missing, it replies asking for the missing details using a simple template. When complete, it saves the feedback and sends an acknowledgment.

## Orchestrator (FastAPI)

- `BACKEND_URL=http://backend:8085`
- `ML_URL=http://ml-service:5000`

## Frontend (React)

- `REACT_APP_API_URL=http://localhost:8085`
- `REACT_APP_CHATBOT_URL=http://localhost:4002`

## Chatbot API (Node)

- `AI_SERVICE=orchestrator|huggingface`
- `ORCHESTRATOR_URL=http://orchestrator:5050`
- `HUGGINGFACE_URL=http://chatbot-hf:5001`
- `BACKEND_BASE_URL=http://backend:8085`

## MySQL

- `MYSQL_DATABASE=dbs_feedback`
- `MYSQL_USER=dbsuser`
- `MYSQL_PASSWORD=dbspass123`
- `MYSQL_PORT=3307` (host port)
