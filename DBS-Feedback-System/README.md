# Universal Feedback System

A full-stack feedback collection and analytics platform with admin workflows and AI-assisted orchestration.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [APIs](./docs/APIs.md)
- [Dataflows](./docs/DATAFLOWS.md)
- [Setup & Run](./docs/SETUP.md)
- [Operations](./docs/OPERATIONS.md)
- [Configuration](./docs/CONFIG.md)

## Quick Start (Docker Compose)

```powershell
# From repo root
docker compose up -d --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8085
```

## Services

- Frontend (React + MUI + Nginx)
- Backend (Spring Boot 3, Java 21)
- Orchestrator (FastAPI + LangGraph)
- ML Service (FastAPI + Transformers)
- Chatbot API (Node/Express)
- HF-like Chat Service (Python)
- MySQL 8
