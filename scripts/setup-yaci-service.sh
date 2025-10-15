#!/bin/bash
# Setup Yaci systemd service
# Run this on the backend container after setup-backend.sh
# Usage: ./scripts/setup-yaci-service.sh

set -e

echo "=========================================="
echo "Yaci Service Configuration"
echo "=========================================="
echo ""

# Load environment variables
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Run ./scripts/setup-backend.sh first"
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
GRPC_ENDPOINT="${CHAIN_GRPC_ENDPOINT:-mantrachain-grpc.polkachu.com:22260}"

echo "Configuration:"
echo "  PostgreSQL Password: ${POSTGRES_PASSWORD:0:3}***"
echo "  gRPC Endpoint: $GRPC_ENDPOINT"
echo ""

# Create systemd service
echo "Step 1: Creating yaci systemd service..."
cat > /etc/systemd/system/yaci.service <<EOF
[Unit]
Description=Yaci Blockchain Indexer
After=postgresql.service postgrest.service
Requires=postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/yaci
ExecStart=/usr/local/bin/yaci extract postgres ${GRPC_ENDPOINT} \\
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

echo "✓ Service file created"

# Reload systemd
echo ""
echo "Step 2: Reloading systemd..."
systemctl daemon-reload

# Enable service
echo ""
echo "Step 3: Enabling yaci service..."
systemctl enable yaci

# Restart service
echo ""
echo "Step 4: Starting yaci service..."
systemctl restart yaci

# Wait a moment
sleep 3

# Check status
echo ""
echo "Step 5: Checking service status..."
systemctl status yaci --no-pager -l

echo ""
echo "=========================================="
echo "Yaci Service Setup Complete!"
echo "=========================================="
echo ""
echo "Service details:"
echo "  gRPC Endpoint: $GRPC_ENDPOINT"
echo "  Database: postgresql://localhost:5432/yaci"
echo "  Prometheus Metrics: http://localhost:2112/metrics"
echo ""
echo "Useful commands:"
echo "  systemctl status yaci        # Check status"
echo "  journalctl -u yaci -f        # Follow logs"
echo "  systemctl restart yaci       # Restart service"
echo ""
echo "Logs (last 20 lines):"
journalctl -u yaci -n 20 --no-pager
echo ""
echo "=========================================="
