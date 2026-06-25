# Setup & Run

This guide explains how to run the full stack with Docker Compose and how to develop locally.

## Prerequisites

- Docker Desktop
- Node.js (if you want to run frontend/chatbot locally)
- Java 21 + Maven (if you want to build backend locally)
- Python 3.10+ (if you want to run orchestrator/ml locally)

## Run with Docker Compose

1. Build images (or let compose build on up):

```powershell
# From repository root
docker compose build
```

1. Start services:

```powershell
docker compose up -d
```

1. Access services:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8085>
- Orchestrator: <http://localhost:5050/health>
- ML Service: <http://localhost:5000/health>
- Chatbot API: <http://localhost:4002/health>
- HF-like Service: <http://localhost:5001/health>
- MySQL: <localhost:3307>

1. Logs & troubleshooting:

```powershell
docker compose ps
docker compose logs -f backend
```

## Local development (optional)

- Frontend
  - `cd frontend/feedback-frontend`
  - `npm install && npm start`
  - API base will default to `http://localhost:8085` when running on port 3000

- Backend
  - `cd backend`
  - `./mvnw spring-boot:run` (PowerShell: `mvnw.cmd spring-boot:run`)
  - Exposes on <http://localhost:8085>

- Orchestrator
  - `cd orchestrator`
  - `pip install -r requirements.txt` or `pip install -e .` (pyproject)
  - `uvicorn app:app --reload --port 5050`

- ML Service
  - `cd ml-service`
  - `pip install -r requirements.txt`
  - `uvicorn sentiment_service:app --reload --port 5000`

- Chatbot API
  - `cd chatbot`
  - `npm install && npm run dev` (or `npm start`)
  - Ensure `AI_SERVICE=orchestrator` for integration with orchestrator

## Environment Variables (compose defaults)

- MySQL: `MYSQL_DATABASE=universal_feedback`, `MYSQL_USER=universal_user`, `MYSQL_PASSWORD=universal_pass123`, `MYSQL_PORT=3307`
- Backend: `SPRING_PROFILES_ACTIVE=docker`, DB URL points to `mysql`
- Orchestrator: `BACKEND_URL=http://backend:8085`, `ML_URL=http://ml-service:5000`
- Frontend: `REACT_APP_API_URL=http://localhost:8085`, `REACT_APP_CHATBOT_URL=http://localhost:4002`
- Chatbot: `AI_SERVICE=orchestrator`, `ORCHESTRATOR_URL=http://orchestrator:5050`

### Email Review Agent (Gmail)

To let the backend watch an inbox and turn emails into feedback:

1. Create a Gmail App Password for the account `venkatmariserla001@gmail.com`.
2. Provide the credentials to the backend via environment variables (compose already wires these):

- `SMTP_USERNAME=venkatmariserla001@gmail.com`
- `SMTP_PASSWORD=<your-app-password>`
- Optionally tune: `EMAIL_IMAP_HOST`, `EMAIL_IMAP_PORT`, `EMAIL_REQUIRED_FIELDS`

3. Ensure the agent is enabled (default is enabled):

- `app.emailAgent.enabled=true`

The agent will:

- Poll INBOX for unread emails every 60 seconds
- Try to extract: Name, Email, ProductId, Rating (1-5), Comment
- If something’s missing, reply asking just for the missing fields with a copy‑and‑fill template
- When complete, it saves the feedback and replies with an acknowledgment

## Notes

- CSV upload size: 10MB limit configured in backend
- Orchestrator timeouts surfaced as 504 from backend when long-running
- For Windows, if `docker buildx bake` flakes, build images per service and `compose up --no-build`
