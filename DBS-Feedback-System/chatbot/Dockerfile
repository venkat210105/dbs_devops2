# Stage 1: Build Node.js chatbot
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Stage 2: Run chatbot
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy built files and dependencies from build stage
COPY --from=build /app .

# Expose chatbot port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:4000/health || exit 1

# Start chatbot service
CMD ["node", "app.js"]
