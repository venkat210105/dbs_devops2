# Use Python slim image for faster builds
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install only essential system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set build argument for ML mode
ARG ML_MODE=mock
ENV ML_MODE=${ML_MODE}

# Copy requirements files
COPY requirements-mock.txt requirements.txt ./

# Install Python dependencies (use mock by default for faster builds)
RUN pip install --no-cache-dir -r requirements-mock.txt

# Copy application code
COPY mock_sentiment_service.py sentiment_service.py ./

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Run the mock service (lightweight)
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "mock_sentiment_service:app"]
