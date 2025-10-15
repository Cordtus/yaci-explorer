#!/bin/bash
# Complete Native Deployment Script for Yaci Explorer
# Run this inside an LXC container to deploy the full stack
# Usage: ./scripts/deploy-native.sh

set -e

INSTALL_PATH="/opt/yaci-explorer"

echo "=========================================="
echo "Yaci Explorer - Native Deployment"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root"
    echo "Use: sudo ./scripts/deploy-native.sh"
    exit 1
fi

# Check if .env exists, create from example if not
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: You must configure .env before continuing!"
    echo ""
    echo "Edit .env and set at minimum:"
    echo "  CHAIN_GRPC_ENDPOINT - Your chain's gRPC endpoint (e.g., 10.x.x.x:9090)"
    echo "  POSTGRES_PASSWORD   - Secure database password"
    echo "  CHAIN_ID            - Your chain identifier"
    echo ""
    echo "Then run this script again."
    exit 0
fi

# Load environment variables
while IFS= read -r line; do
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
        export "$line"
    fi
done < .env

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-foobar}"
POSTGREST_PORT="${POSTGREST_PORT:-3000}"
CHAIN_GRPC_ENDPOINT="${CHAIN_GRPC_ENDPOINT:-localhost:9090}"
FRONTEND_PORT="${FRONTEND_PORT:-3001}"

# Verify critical config
if [ "$CHAIN_GRPC_ENDPOINT" = "localhost:9090" ] || [ "$CHAIN_GRPC_ENDPOINT" = "host.docker.internal:9090" ]; then
    echo "ERROR: CHAIN_GRPC_ENDPOINT not configured in .env"
    echo "Please set it to your chain's actual gRPC endpoint"
    exit 1
fi

echo "Configuration:"
echo "  Chain Endpoint: $CHAIN_GRPC_ENDPOINT"
echo "  PostgreSQL Password: ${POSTGRES_PASSWORD:0:3}***"
echo "  PostgREST Port: $POSTGREST_PORT"
echo "  Frontend Port: $FRONTEND_PORT"
echo ""
echo "Starting deployment..."
echo ""

# ============================================
# STEP 1: Install PostgreSQL
# ============================================
echo "Step 1: Installing PostgreSQL..."
apt-get update > /dev/null 2>&1
apt-get install -y postgresql postgresql-contrib > /dev/null 2>&1
echo "  PostgreSQL installed"

# Configure PostgreSQL
echo "  Configuring database..."
sudo -u postgres psql -c "CREATE DATABASE yaci;" 2>/dev/null || echo "  Database already exists"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${POSTGRES_PASSWORD}';" > /dev/null
systemctl enable postgresql > /dev/null 2>&1
systemctl restart postgresql
echo "  PostgreSQL configured and running"

# ============================================
# STEP 2: Install PostgREST
# ============================================
echo ""
echo "Step 2: Installing PostgREST..."
POSTGREST_VERSION="v12.0.2"
cd /tmp
if [ ! -f "/usr/local/bin/postgrest" ]; then
    wget -q https://github.com/PostgREST/postgrest/releases/download/${POSTGREST_VERSION}/postgrest-${POSTGREST_VERSION}-linux-static-x64.tar.xz
    tar xf postgrest-${POSTGREST_VERSION}-linux-static-x64.tar.xz
    mv postgrest /usr/local/bin/
    chmod +x /usr/local/bin/postgrest
    rm postgrest-${POSTGREST_VERSION}-linux-static-x64.tar.xz
    echo "  PostgREST installed"
else
    echo "  PostgREST already installed"
fi

# Create PostgREST config
echo "  Creating PostgREST configuration..."
cat > /etc/postgrest.conf <<EOF
db-uri = "postgres://postgres:${POSTGRES_PASSWORD}@localhost:5432/yaci"
db-schemas = "api"
db-anon-role = "postgres"
server-port = ${POSTGREST_PORT}
EOF

# Create PostgREST systemd service
cat > /etc/systemd/system/postgrest.service <<EOF
[Unit]
Description=PostgREST API Server
After=postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=postgres
ExecStart=/usr/local/bin/postgrest /etc/postgrest.conf
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable postgrest > /dev/null 2>&1
systemctl restart postgrest
echo "  PostgREST configured and running"

# ============================================
# STEP 3: Install Go and Build Yaci
# ============================================
echo ""
echo "Step 3: Installing Go and building Yaci indexer..."

# Install Go if not present
if ! command -v go &> /dev/null; then
    echo "  Installing Go 1.21.5..."
    wget -q https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
    rm -rf /usr/local/go
    tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
    export PATH=$PATH:/usr/local/go/bin
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
    rm go1.21.5.linux-amd64.tar.gz
    echo "  Go installed"
else
    export PATH=$PATH:/usr/local/go/bin
    echo "  Go already installed ($(go version))"
fi

# Clone/update Yaci
cd /opt
if [ ! -d "yaci" ]; then
    echo "  Cloning Yaci indexer (Cordtus fork)..."
    git clone -q -b main https://github.com/Cordtus/yaci.git
else
    echo "  Updating Yaci indexer..."
    cd yaci
    git fetch -q origin
    git checkout -q main
    git pull -q origin main
    cd ..
fi

# Build Yaci
echo "  Building Yaci indexer..."
cd yaci
make build > /dev/null 2>&1

# Stop yaci service if running to allow binary replacement
if systemctl is-active --quiet yaci 2>/dev/null; then
    echo "  Stopping existing yaci service..."
    systemctl stop yaci
fi

cp bin/yaci /usr/local/bin/yaci
chmod +x /usr/local/bin/yaci
echo "  Yaci built and installed"

# ============================================
# STEP 4: Create Yaci Systemd Service
# ============================================
echo ""
echo "Step 4: Configuring Yaci indexer service..."

cat > /etc/systemd/system/yaci.service <<EOF
[Unit]
Description=Yaci Blockchain Indexer
After=postgresql.service postgrest.service
Requires=postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/yaci
ExecStart=/usr/local/bin/yaci extract postgres ${CHAIN_GRPC_ENDPOINT} \\
  -p "postgres://postgres:${POSTGRES_PASSWORD}@localhost:5432/yaci?sslmode=disable" \\
  --live \\
  --enable-prometheus \\
  --prometheus-addr 0.0.0.0:2112 \\
  --enable-denom-resolver \\
  -k
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable yaci > /dev/null 2>&1
systemctl restart yaci
echo "  Yaci service configured and started"

# Wait for initial indexing
echo "  Waiting for initial blocks to index..."
sleep 5

# ============================================
# STEP 5: Install Node.js and Frontend
# ============================================
echo ""
echo "Step 5: Installing Node.js and building frontend..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "  Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
    echo "  Node.js installed ($(node --version))"
else
    echo "  Node.js already installed ($(node --version))"
fi

# Install frontend dependencies
echo "  Installing frontend dependencies..."
cd ${INSTALL_PATH}
npm install > /dev/null 2>&1
echo "  Dependencies installed"

# Build frontend
echo "  Building frontend..."
npm run build > /dev/null 2>&1
echo "  Frontend built"

# Start frontend server
echo "  Starting frontend server..."
pkill -f "npm run preview" 2>/dev/null || true
nohup npm run preview -- --port ${FRONTEND_PORT} --host 0.0.0.0 > frontend.log 2>&1 &
sleep 2
echo "  Frontend server started on port ${FRONTEND_PORT}"

# ============================================
# STEP 6: Verify Deployment
# ============================================
echo ""
echo "Step 6: Verifying deployment..."

# Check PostgreSQL
if systemctl is-active --quiet postgresql; then
    echo "  PostgreSQL: Running"
else
    echo "  PostgreSQL: ERROR - Not running"
fi

# Check PostgREST
if systemctl is-active --quiet postgrest; then
    echo "  PostgREST: Running"
    # Test API
    if curl -s http://localhost:${POSTGREST_PORT}/ > /dev/null 2>&1; then
        echo "  PostgREST API: Responding"
    fi
else
    echo "  PostgREST: ERROR - Not running"
fi

# Check Yaci
if systemctl is-active --quiet yaci; then
    echo "  Yaci Indexer: Running"
    # Check metrics
    if curl -s http://localhost:2112/metrics > /dev/null 2>&1; then
        echo "  Prometheus Metrics: Available"
    fi
else
    echo "  Yaci Indexer: ERROR - Not running"
fi

# Check frontend
if pgrep -f "npm run preview" > /dev/null; then
    echo "  Frontend: Running"
else
    echo "  Frontend: ERROR - Not running"
fi

# Check database has blocks
BLOCK_COUNT=$(sudo -u postgres psql -t yaci -c "SELECT COUNT(*) FROM api.blocks_raw;" 2>/dev/null | tr -d ' ' || echo "0")
echo "  Indexed Blocks: $BLOCK_COUNT"

# ============================================
# COMPLETE
# ============================================
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Access Points:"
echo "  Explorer UI:         http://localhost:${FRONTEND_PORT}"
echo "  PostgREST API:       http://localhost:${POSTGREST_PORT}"
echo "  Prometheus Metrics:  http://localhost:2112/metrics"
echo "  PostgreSQL:          localhost:5432"
echo ""
echo "Service Status:"
systemctl status postgresql postgrest yaci --no-pager -l | grep "Active:"
echo ""
echo "Useful Commands:"
echo "  systemctl status yaci        # Check indexer status"
echo "  journalctl -u yaci -f        # Follow indexer logs"
echo "  tail -f ${INSTALL_PATH}/frontend.log  # Follow frontend logs"
echo ""
echo "  # Check indexing progress"
echo "  sudo -u postgres psql yaci -c 'SELECT MAX(id) FROM api.blocks_raw;'"
echo ""
echo "  # Test API"
echo "  curl http://localhost:${POSTGREST_PORT}/blocks_raw?limit=1"
echo ""
echo "=========================================="
