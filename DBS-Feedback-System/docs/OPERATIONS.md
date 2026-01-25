# Operations & Troubleshooting

## Health Checks

- Backend: `GET /api/health` (also `/health`)
- Orchestrator: `GET /health`
- ML Service: `GET /health`
- Chatbot API: `GET /health`
- Frontend (Nginx): `GET /health`

## Common Issues

- CSV upload errors
  - 400: empty file/body → ensure form field is `file` and not empty
  - 502: Orchestrator endpoint missing → restart/rebuild orchestrator
  - 504: Orchestrator read timeout → import continues in background; check alerts; adjust `orchestrator.read-timeout-ms`

- Frontend cannot reach backend in dev
  - Ensure React dev server runs on :3000; API base falls back to `http://localhost:8085` or use CRA proxy

- Docker build flakiness on Windows
  - Build per service: `docker compose build backend orchestrator frontend` then `docker compose up --no-build`

## Logs

```powershell
docker compose logs -f backend
```

Backend logs orchestrator forwarding results and CSV parsing counts.

## Configuration & Timeouts

- Backend → Orchestrator:
  - `orchestrator.url` (default `http://orchestrator:5050`)
  - `orchestrator.connect-timeout-ms` (default 5000)
  - `orchestrator.read-timeout-ms` (default 120000)

- File upload limits:
  - `spring.servlet.multipart.max-file-size=10MB`
  - `spring.servlet.multipart.max-request-size=10MB`

## Security Notes

- CORS allows localhost origins for development; restrict origins for production
- Email notifications use `EmailService`; configure SMTP creds securely in env/secret store
