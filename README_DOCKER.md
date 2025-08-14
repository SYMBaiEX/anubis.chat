# Docker Configuration for ANUBIS Chat

## Overview

Complete Docker configuration for the ANUBIS Chat platform with production and development environments.

## Files Created

### Core Docker Files
- `Dockerfile` - Multi-stage production build with Bun 1.2.18
- `Dockerfile.dev` - Development configuration with hot-reload
- `.dockerignore` - Optimized build context
- `docker-compose.yml` - Production orchestration
- `docker-compose.dev.yml` - Development environment
- `nginx/nginx.conf` - Reverse proxy configuration
- `apps/web/src/app/api/health/route.ts` - Health check endpoint

## Features

### Production Build
- **Multi-stage build** for optimized image size
- **Non-root user** for enhanced security
- **Standalone Next.js output** for minimal footprint
- **Health checks** for container monitoring
- **BuildKit caching** for faster builds

### Services

#### 1. Web Application (Next.js)
- Runs on port 3000 (production) or 3001 (development)
- Standalone build with minimal dependencies
- Built-in health check endpoint at `/api/health`
- Non-root user execution for security

#### 2. Redis Cache
- Alpine-based for minimal size
- Persistent data with AOF
- Memory limits and eviction policies
- Health check with write test

#### 3. Nginx Reverse Proxy
- Load balancing and caching
- WebSocket support for Convex
- Rate limiting for API protection
- Security headers
- Gzip compression

## Usage

### Prerequisites
```bash
# Install Docker and Docker Compose
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# macOS
brew install docker docker-compose
```

### Production Deployment

1. **Build and start services:**
```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

2. **Environment variables:**
Create a `.env` file:
```env
CONVEX_URL=https://your-convex-url.convex.cloud
CONVEX_DEPLOYMENT=production
APP_URL=https://anubis.chat
```

### Development Environment

1. **Start development services:**
```bash
# Start with hot-reload
docker-compose -f docker-compose.dev.yml up

# Run specific service
docker-compose -f docker-compose.dev.yml up web

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml build --no-cache
```

2. **Access services:**
- Web app: http://localhost:3001
- Convex: http://localhost:3210
- Redis: localhost:6379

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Test health endpoint
curl http://localhost:3000/api/health
```

### Container Management

```bash
# View running containers
docker ps

# Enter container shell
docker exec -it anubis-web sh

# View container logs
docker logs anubis-web

# Clean up resources
docker system prune -a
```

## Image Optimization

### Size Targets
- Production image: ~150MB
- Development image: ~300MB
- Build time: <2 minutes

### Build Cache
```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with cache
docker build --cache-from anubis-chat:latest -t anubis-chat:latest .
```

## Security Best Practices

1. **Non-root user** - Containers run as `nextjs` user
2. **Read-only volumes** - Configuration files mounted as read-only
3. **Network isolation** - Services communicate on internal network
4. **Rate limiting** - Nginx limits request rates
5. **Security headers** - CSP, HSTS, X-Frame-Options configured

## Monitoring

### Logs
```bash
# Application logs
docker-compose logs web

# Nginx access logs
docker exec anubis-nginx cat /var/log/nginx/access.log

# Redis logs
docker-compose logs redis
```

### Metrics
- Container stats: `docker stats`
- Health status: `/api/health` endpoint
- Uptime monitoring via health checks

## Troubleshooting

### Common Issues

1. **Port conflicts:**
```bash
# Check port usage
sudo lsof -i :3000
```

2. **Build failures:**
```bash
# Clear cache and rebuild
docker-compose build --no-cache
```

3. **Container won't start:**
```bash
# Check logs
docker-compose logs [service-name]
```

4. **Permission issues:**
```bash
# Fix ownership
docker exec -u root anubis-web chown -R nextjs:nodejs /app
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: anubis-chat:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Performance Tuning

### Nginx Optimization
- Worker processes: Auto-detected
- Keepalive connections: 32
- Gzip compression: Enabled
- Static file caching: 7 days

### Node.js Optimization
- Cluster mode: Available via PM2
- Memory limits: 512MB production
- CPU limits: 1 core production

## Next Steps

1. **SSL Configuration:**
   - Add certificates to `nginx/ssl/`
   - Uncomment SSL sections in nginx.conf

2. **Scaling:**
   - Add Docker Swarm or Kubernetes
   - Implement horizontal scaling

3. **Monitoring:**
   - Add Prometheus metrics
   - Integrate with Grafana dashboards

4. **Backup:**
   - Implement Redis backup strategy
   - Add volume backup scripts

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Nginx Best Practices](https://www.nginx.com/resources/wiki/start/topics/tutorials/config_pitfalls/)
- [Redis Docker Guide](https://redis.io/docs/stack/get-started/install/docker/)