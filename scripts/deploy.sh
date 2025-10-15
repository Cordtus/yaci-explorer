#!/bin/bash
# Native LXC deployment (no Docker)
# Runs backend services and frontend server
# Usage: ./scripts/deploy.sh

set -e

FRONTEND_PORT="${FRONTEND_PORT:-3001}"
POSTGREST_PORT="${POSTGREST_PORT:-3000}"

echo "=========================================="
echo "Yaci Explorer - Native Deployment"
echo "=========================================="
echo "Frontend will run on: http://localhost:${FRONTEND_PORT}"
echo "PostgREST API will run on: http://localhost:${POSTGREST_PORT}"
echo ""

# Pull latest code
echo "Step 1: Pulling latest code..."
git pull origin main || echo "Skipping git pull"

# Check if .env exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠ Created .env - please configure CHAIN_GRPC_ENDPOINT and run again"
    exit 1
fi

# Load environment variables, ignoring comments and blank lines
while IFS= read -r line; do
    # Skip comments and blank lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    # Export valid variable assignments
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
        export "$line"
    fi
done < .env

# Install dependencies if needed
echo ""
echo "Step 2: Installing Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build frontend
echo ""
echo "Step 3: Building frontend..."
VITE_POSTGREST_URL="http://localhost:${POSTGREST_PORT}" npm run build

# Install serve if not present
if ! command -v serve &> /dev/null; then
    echo ""
    echo "Step 4: Installing 'serve' package..."
    npm install -g serve
fi

# Stop existing processes
echo ""
echo "Step 5: Stopping existing processes..."
pkill -f "serve.*build/client" || true
pkill -f "node.*build/server" || true

# Start frontend server
echo ""
echo "Step 6: Starting frontend server..."
nohup serve -s build/client -l ${FRONTEND_PORT} > /var/log/yaci-explorer.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend server started (PID: ${FRONTEND_PID})"

# Wait a moment and verify it started
sleep 2
if ps -p ${FRONTEND_PID} > /dev/null; then
    echo "✓ Frontend is running on port ${FRONTEND_PORT}"
else
    echo "✗ Frontend failed to start"
    cat /var/log/yaci-explorer.log
    exit 1
fi

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Frontend: http://localhost:${FRONTEND_PORT}"
echo "Logs: /var/log/yaci-explorer.log"
echo ""
echo "Configure Caddy to proxy to this port:"
echo ""
echo "  explorer.yourdomain.com {"
echo "      reverse_proxy localhost:${FRONTEND_PORT}"
echo "  }"
echo ""
echo "To stop: pkill -f 'serve.*build/client'"
echo "To view logs: tail -f /var/log/yaci-explorer.log"
echo "=========================================="
