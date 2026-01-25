# syntax=docker/dockerfile:1.4
# Stage 1: Build React app
FROM node:18-alpine AS build
WORKDIR /app
COPY feedback-frontend/package*.json ./
# Use BuildKit cache for npm to speed up repeated installs
RUN --mount=type=cache,target=/root/.npm npm ci --silent --no-audit --no-fund
COPY feedback-frontend/public ./public
COPY feedback-frontend/src ./src
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine
COPY feedback-frontend/nginx.conf /etc/nginx/conf.d/default.conf
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/build .
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:80 || exit 1
CMD ["nginx", "-g", "daemon off;"]
