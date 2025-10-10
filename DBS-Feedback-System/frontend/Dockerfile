# Stage 1: Build React app
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json from feedback-frontend directory
COPY feedback-frontend/package*.json ./

# Install dependencies with clean npm cache
RUN npm ci --only=production --silent

# Copy all source files
COPY feedback-frontend/ .

# Build the React app for production
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine

# Create app user for security
RUN addgroup -g 1001 -S nodejs && adduser -S reactjs -u 1001

# Copy custom nginx configuration
COPY feedback-frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx content and copy React build
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/build .

# Change ownership to nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Expose frontend port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
