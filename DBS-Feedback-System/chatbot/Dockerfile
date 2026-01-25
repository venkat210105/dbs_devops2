FROM node:20-alpine
WORKDIR /app

# Install deps separately for better caching
COPY package.json package-lock.json* ./
RUN npm ci || npm install --no-audit --no-fund

# Copy source
COPY . .

ENV NODE_ENV=production
ENV PORT=4002

# Expose chatbot port
EXPOSE 4002

# Health check matches app.js health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4002/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start chatbot service
CMD ["node", "app.js"]
