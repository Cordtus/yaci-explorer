#!/bin/bash
# Backend and Frontend Deployment Script
# Run on backend container (10.70.48.134)
# Usage: ./scripts/deploy.sh [FRONTEND_HOST] [WEBROOT]

set -e

FRONTEND_HOST="${1:-10.70.48.100}"
WEBROOT="${2:-/var/www/yaci-explorer}"

echo "=========================================="
echo "Yaci Explorer - Deployment"
echo "=========================================="
echo "Backend: This container"
echo "Frontend: ${FRONTEND_HOST}:${WEBROOT}"
echo ""

# Check if running in the right directory
if [ ! -f "docker/docker-compose.yml" ]; then
    echo "ERROR: docker/docker-compose.yml not found!"
    exit 1
fi

# Pull latest code
echo "Step 1: Pulling latest code..."
git pull origin main

# Check if .env exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠ Created .env - please configure and run again"
    exit 1
fi

# Stop existing containers and clean up
echo ""
echo "Step 2: Cleaning up old containers..."
docker compose -f docker/docker-compose.yml down -v
docker system prune -f

# Start backend services (no explorer frontend)
echo ""
echo "Step 3: Starting backend services..."
docker compose -f docker/docker-compose.yml up -d postgres postgrest yaci

echo ""
echo "Step 4: Waiting for services..."
sleep 15

# Build frontend
echo ""
echo "Step 5: Building frontend..."
if [ ! -d "node_modules" ]; then
    npm install
fi

VITE_POSTGREST_URL=/api npm run build

# Deploy frontend to Caddy server
echo ""
echo "Step 6: Deploying frontend to ${FRONTEND_HOST}..."
if [ "${FRONTEND_HOST}" = "localhost" ] || [ "${FRONTEND_HOST}" = "127.0.0.1" ]; then
    # Local deployment
    mkdir -p "${WEBROOT}"
    rm -rf "${WEBROOT}"/*
    cp -r build/client/* "${WEBROOT}/"
    echo "✓ Frontend deployed locally"
else
    # Remote deployment
    ssh root@${FRONTEND_HOST} "mkdir -p ${WEBROOT} && rm -rf ${WEBROOT}/*"
    scp -r build/client/* root@${FRONTEND_HOST}:${WEBROOT}/
    ssh root@${FRONTEND_HOST} "/etc/init.d/caddy reload 2>/dev/null || systemctl reload caddy 2>/dev/null || true"
    echo "✓ Frontend deployed to ${FRONTEND_HOST}"
fi

# Check services
echo ""
echo "Service Status:"
docker compose -f docker/docker-compose.yml ps

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Backend services (this container):"
echo "  - PostgreSQL: localhost:5432"
echo "  - PostgREST: localhost:3000"
echo "  - Yaci Indexer: (internal)"
echo ""
echo "Frontend: ${FRONTEND_HOST}:${WEBROOT}"
echo ""
echo "View logs: docker compose -f docker/docker-compose.yml logs -f"
echo "=========================================="
