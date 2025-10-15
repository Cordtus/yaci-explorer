#!/bin/bash
# Setup script for backend services (PostgreSQL, PostgREST, Yaci)
# Run this once to install and configure backend
# Usage: ./scripts/setup-backend.sh

set -e

echo "=========================================="
echo "Backend Services Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

# Load config
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠ Created .env - please configure and run again"
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

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-foobar}"
POSTGREST_PORT="${POSTGREST_PORT:-3000}"
CHAIN_GRPC_ENDPOINT="${CHAIN_GRPC_ENDPOINT:-localhost:9090}"

echo "Step 1: Installing PostgreSQL..."
apt-get update
apt-get install -y postgresql postgresql-contrib

echo ""
echo "Step 2: Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE yaci;" || echo "Database already exists"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${POSTGRES_PASSWORD}';"

echo ""
echo "Step 3: Installing PostgREST..."
POSTGREST_VERSION="v12.0.2"
cd /tmp
wget -q https://github.com/PostgREST/postgrest/releases/download/${POSTGREST_VERSION}/postgrest-${POSTGREST_VERSION}-linux-static-x64.tar.xz
tar xf postgrest-${POSTGREST_VERSION}-linux-static-x64.tar.xz
mv postgrest /usr/local/bin/
chmod +x /usr/local/bin/postgrest
rm postgrest-${POSTGREST_VERSION}-linux-static-x64.tar.xz

echo ""
echo "Step 4: Creating PostgREST config..."
cat > /etc/postgrest.conf <<EOF
db-uri = "postgres://postgres:${POSTGRES_PASSWORD}@localhost:5432/yaci"
db-schemas = "api"
db-anon-role = "postgres"
server-port = ${POSTGREST_PORT}
EOF

echo ""
echo "Step 5: Creating systemd service for PostgREST..."
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
systemctl enable postgrest
systemctl start postgrest

echo ""
echo "Step 6: Installing Yaci Indexer..."
# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "Installing Go..."
    wget -q https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
    rm -rf /usr/local/go
    tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
    export PATH=$PATH:/usr/local/go/bin
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
    rm go1.21.5.linux-amd64.tar.gz
fi

# Clone and build Yaci
cd /opt
if [ ! -d "yaci" ]; then
    git clone https://github.com/manifest-network/yaci.git
fi
cd yaci
git pull
go build -o /usr/local/bin/yaci

echo ""
echo "Step 7: Creating Yaci systemd service..."
cat > /etc/systemd/system/yaci.service <<EOF
[Unit]
Description=Yaci Blockchain Indexer
After=postgresql.service postgrest.service
Requires=postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/yaci
Environment="GRPC_ENDPOINT=${CHAIN_GRPC_ENDPOINT}"
Environment="DB_HOST=localhost"
Environment="DB_PORT=5432"
Environment="DB_USER=postgres"
Environment="DB_PASSWORD=${POSTGRES_PASSWORD}"
Environment="DB_NAME=yaci"
ExecStart=/usr/local/bin/yaci index
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable yaci
systemctl start yaci

echo ""
echo "=========================================="
echo "Backend Setup Complete!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - PostgREST: localhost:${POSTGREST_PORT}"
echo "  - Yaci Indexer: running"
echo ""
echo "Check status:"
echo "  systemctl status postgresql"
echo "  systemctl status postgrest"
echo "  systemctl status yaci"
echo ""
echo "View logs:"
echo "  journalctl -u postgrest -f"
echo "  journalctl -u yaci -f"
echo ""
echo "Test API:"
echo "  curl http://localhost:${POSTGREST_PORT}/blocks_raw?limit=1"
echo "=========================================="
