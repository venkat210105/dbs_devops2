# syntax=docker/dockerfile:1.4
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt
COPY app.py ./
COPY agents ./agents
EXPOSE 5050
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["/bin/sh", "-c", "python - <<'PY'\nimport urllib.request, sys\ntry:\n    with urllib.request.urlopen('http://localhost:5050/health', timeout=3) as r:\n        sys.exit(0 if getattr(r, 'status', 200)==200 else 1)\nexcept Exception:\n    sys.exit(1)\nPY\n"]
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5050"]
