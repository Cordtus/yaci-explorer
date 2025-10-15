#!/bin/bash
# Backend deployment script (PostgREST + Yaci + PostgreSQL)
# Run this on the BACKEND container (10.70.48.134)
# Usage: ./scripts/deploy-backend.sh

set -e

echo "=========================================="
echo "Yaci Explorer - Backend Deployment"
echo "=========================================="
echo "Target: Backend Container (10.70.48.134)"
echo ""

# Check if running in the right directory
if [ ! -f "docker/docker-compose.yml" ]; then
    echo "ERROR: docker/docker-compose.yml not found!"
    echo "Please run this script from the yaci-explorer repository root"
    exit 1
fi

# Pull latest code
echo "Step 1: Pulling latest code..."
git pull origin main

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "WARNING: .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo ""
    echo "Please edit .env and configure:"
    echo "  - CHAIN_GRPC_ENDPOINT (your chain's gRPC endpoint)"
    echo "  - POSTGRES_PASSWORD (secure password)"
    echo "  - CHAIN_ID and CHAIN_NAME"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Show current configuration
echo ""
echo "Current Configuration:"
echo "----------------------"
grep -E "^(CHAIN_GRPC_ENDPOINT|POSTGRES_PASSWORD|CHAIN_ID|YACI_IMAGE)" .env || true
echo ""
read -p "Continue with this configuration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled. Edit .env and run again."
    exit 1
fi

# Stop existing containers
echo ""
echo "Step 2: Stopping existing containers..."
docker compose -f docker/docker-compose.yml down

# Pull latest images
echo ""
echo "Step 3: Pulling latest Docker images..."
docker compose -f docker/docker-compose.yml pull

# Start backend services (postgres, yaci, postgrest)
# Explicitly exclude the explorer frontend
echo ""
echo "Step 4: Starting backend services..."
docker compose -f docker/docker-compose.yml up -d postgres postgrest yaci

# Wait for services to be healthy
echo ""
echo "Step 5: Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "Service Status:"
echo "---------------"
docker compose -f docker/docker-compose.yml ps

# Test PostgreSQL connection
echo ""
echo "Step 6: Testing PostgreSQL connection..."
if docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✓ PostgreSQL is ready"
else
    echo "✗ PostgreSQL is not responding"
fi

# Test PostgREST endpoint
echo ""
echo "Step 7: Testing PostgREST API..."
sleep 5  # Give PostgREST time to start
if curl -f -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "✓ PostgREST API is responding"
else
    echo "✗ PostgREST API is not responding"
fi

# Show recent Yaci logs
echo ""
echo "Step 8: Checking Yaci indexer status..."
echo "Recent Yaci logs:"
docker compose -f docker/docker-compose.yml logs --tail=20 yaci

echo ""
echo "=========================================="
echo "Backend Deployment Complete!"
echo "=========================================="
echo ""
echo "Services running on this container (10.70.48.134):"
echo "  - PostgreSQL: localhost:5432"
echo "  - PostgREST API: localhost:3000"
echo "  - Yaci Indexer: (internal)"
echo "  - Prometheus Metrics: localhost:2112"
echo ""
echo "External access:"
echo "  - PostgREST API: http://10.70.48.134:3000"
echo ""
echo "Next steps:"
echo "  1. Test API: curl http://10.70.48.134:3000/blocks_raw?limit=1"
echo "  2. Deploy frontend on Caddy container (10.70.48.100)"
echo "  3. Monitor logs: docker compose -f docker/docker-compose.yml logs -f"
echo "=========================================="
