FROM python:3.11-slim

# Create app user for security
RUN groupadd -r appgroup && useradd -r -g appgroup -d /home/appuser -s /sbin/nologin -c "App user" appuser

# Set working directory
WORKDIR /home/appuser

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

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

# Run FastAPI app with uvicorn and production settings
CMD ["uvicorn", "sentiment_service:app", "--host", "0.0.0.0", "--port", "5000", "--workers", "2"]
