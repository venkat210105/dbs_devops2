# DBS Feedback System - Docker Deployment

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose v3.8+
- 8GB+ RAM recommended
- Ports 3000, 8085, 5000, 3307 available

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Default values work for development
```

### 2. Build and Start Services
```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8085
- **ML Service**: http://localhost:5000
- **Database**: localhost:3307

## Service Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   (React)       │────│  (Spring Boot)   │────│    (MySQL)      │
│   Port: 3000    │    │   Port: 8085     │    │   Port: 3307    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         │              ┌─────────────────┐
         └──────────────│   ML Service    │
                        │   (Python)      │
                        │   Port: 5000    │
                        └─────────────────┘
```

## Docker Commands

### Development Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild specific service
docker-compose build frontend
docker-compose up -d frontend

# View service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Scale services (if needed)
docker-compose up -d --scale backend=2
```

### Production Commands
```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Update services
docker-compose pull
docker-compose up -d

# Backup database
docker exec dbs-feedback-mysql mysqldump -u root -p dbs_feedback > backup.sql
```

### Maintenance Commands
```bash
# Clean up unused containers and images
docker system prune -a

# Remove all project containers and volumes
docker-compose down -v --remove-orphans

# Reset database (WARNING: This deletes all data)
docker-compose down -v
docker volume rm dbs-feedback-system_mysql_data
docker-compose up -d
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_ROOT_PASSWORD` | Database root password | `dbs_root_secure_2024` |
| `MYSQL_DATABASE` | Database name | `dbs_feedback` |
| `MYSQL_USER` | Application database user | `dbsuser` |
| `MYSQL_PASSWORD` | Application database password | `dbs_secure_pass_2024` |
| `BACKEND_PORT` | Backend service port | `8085` |
| `FRONTEND_PORT` | Frontend service port | `3000` |
| `ML_SERVICE_PORT` | ML service port | `5000` |

## Health Checks

All services include health checks:
- **Frontend**: `http://localhost:3000/health`
- **Backend**: `http://localhost:8085/api/health`
- **ML Service**: `http://localhost:5000/health`
- **Database**: MySQL ping check

```bash
# Check all service health
docker-compose ps

# Manual health check
curl http://localhost:3000/health
curl http://localhost:8085/api/health
curl http://localhost:5000/health
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   
   # Use different ports in .env file
   FRONTEND_PORT=3001
   BACKEND_PORT=8086
   ```

2. **Database Connection Issues**
   ```bash
   # Check MySQL logs
   docker-compose logs mysql
   
   # Connect to database directly
   docker exec -it dbs-feedback-mysql mysql -u root -p
   ```

3. **Memory Issues**
   ```bash
   # Check Docker stats
   docker stats
   
   # Increase Docker Desktop memory limit
   # Settings > Resources > Memory > 8GB+
   ```

### Service Dependencies
- Frontend depends on Backend
- Backend depends on MySQL
- All services depend on network creation

### Data Persistence
- MySQL data: `./docker-data/mysql` (configurable via `DATA_PATH`)
- Logs: Container logs via Docker logging driver

## Security Notes

- Change default passwords in production
- Use secrets management for sensitive data
- Enable SSL/TLS for production deployments
- Regular security updates for base images
- Network isolation via Docker networks

## Monitoring

```bash
# Resource usage
docker stats

# Service logs
docker-compose logs --tail=100 -f

# Container inspection
docker inspect dbs-feedback-backend
```