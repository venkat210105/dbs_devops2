# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

# Create app user for security
RUN groupadd -r appgroup && useradd -r -g appgroup -d /home/appuser -s /sbin/nologin -c "App user" appuser

# Set working directory
WORKDIR /home/appuser

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

ARG ML_MODE=full

# Copy and install Python dependencies
COPY requirements.txt ./
COPY requirements-mock.txt ./
# Use a single cache mount for pip to speed up repeated installs
RUN --mount=type=cache,target=/root/.cache/pip \
  pip install --no-cache-dir --upgrade pip && \
  if [ "$ML_MODE" = "mock" ]; then \
    pip install --no-cache-dir -r requirements-mock.txt; \
  else \
    pip install --no-cache-dir -r requirements.txt; \
  fi

# Copy source code
COPY sentiment_service.py .
COPY mock_sentiment_service.py .

# Change ownership to app user
RUN chown -R appuser:appgroup /home/appuser

# Switch to non-root user
USER appuser

# Expose ML service port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Run service based on selected mode
CMD ["sh", "-c", "if [ \"$ML_MODE\" = \"mock\" ]; then exec gunicorn -w 2 -b 0.0.0.0:5000 mock_sentiment_service:app; else exec uvicorn sentiment_service:app --host 0.0.0.0 --port 5000 --workers 2; fi"]
