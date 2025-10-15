#!/bin/bash
# LXC Deployment Helper Script for Yaci Explorer
# This script helps deploy the full stack in an LXC environment
# Usage: ./scripts/lxc-deploy.sh [container-name]

set -e

CONTAINER_NAME="${1:-yaci-indexer}"
REPO_URL="https://github.com/Cordtus/yaci-explorer.git"
INSTALL_PATH="/opt/yaci-explorer"

echo "=========================================="
echo "Yaci Explorer - LXC Deployment Helper"
echo "=========================================="
echo "Container: ${CONTAINER_NAME}"
echo "Install Path: ${INSTALL_PATH}"
echo ""

# Function to run commands in container
lxc_exec() {
    lxc exec "${CONTAINER_NAME}" -- bash -c "$1"
}

# Check if container exists
if ! lxc list --format=csv -c n | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Container '${CONTAINER_NAME}' not found!"
    echo ""
    echo "Available containers:"
    lxc list
    echo ""
    echo "Create a container first:"
    echo "  lxc launch ubuntu:22.04 ${CONTAINER_NAME}"
    echo "  lxc config set ${CONTAINER_NAME} security.nesting true"
    echo "  lxc config set ${CONTAINER_NAME} security.syscalls.intercept.mknod true"
    echo "  lxc config set ${CONTAINER_NAME} security.syscalls.intercept.setxattr true"
    exit 1
fi

# Check container state
STATE=$(lxc list --format=csv -c s "${CONTAINER_NAME}")
if [ "$STATE" != "RUNNING" ]; then
    echo "⚠️  Container is ${STATE}, starting..."
    lxc start "${CONTAINER_NAME}"
    sleep 3
fi

# Get container IP
CONTAINER_IP=$(lxc list "${CONTAINER_NAME}" --format=csv -c 4 | awk '{print $1}')
if [ -z "$CONTAINER_IP" ]; then
    echo "❌ Could not get container IP"
    exit 1
fi

echo "✓ Container IP: ${CONTAINER_IP}"
echo ""

# Step 1: Install Docker if not present
echo "Step 1: Checking Docker installation..."
if ! lxc_exec "command -v docker &> /dev/null"; then
    echo "  Installing Docker..."
    lxc_exec "apt update && DEBIAN_FRONTEND=noninteractive apt install -y curl ca-certificates"
    lxc_exec "curl -fsSL https://get.docker.com | sh"
    lxc_exec "apt install -y docker-compose-plugin"
    echo "  ✓ Docker installed"
else
    echo "  ✓ Docker already installed"
fi

# Verify Docker
if ! lxc_exec "docker --version"; then
    echo "❌ Docker installation failed"
    exit 1
fi

# Step 2: Clone or update repository
echo ""
echo "Step 2: Setting up repository..."
if lxc_exec "[ -d ${INSTALL_PATH} ]"; then
    echo "  Repository exists, pulling latest..."
    lxc_exec "cd ${INSTALL_PATH} && git pull origin main"
else
    echo "  Cloning repository..."
    lxc_exec "git clone ${REPO_URL} ${INSTALL_PATH}"
fi
echo "  ✓ Repository ready"

# Step 3: Configure environment
echo ""
echo "Step 3: Configuring environment..."
if ! lxc_exec "[ -f ${INSTALL_PATH}/.env ]"; then
    echo "  Creating .env from template..."
    lxc_exec "cp ${INSTALL_PATH}/.env.example ${INSTALL_PATH}/.env"
    echo ""
    echo "⚠️  IMPORTANT: You must configure .env before deployment!"
    echo ""
    echo "Edit the configuration in the container:"
    echo "  lxc exec ${CONTAINER_NAME} -- nano ${INSTALL_PATH}/.env"
    echo ""
    echo "Key settings to configure:"
    echo "  CHAIN_GRPC_ENDPOINT  - Your chain's gRPC endpoint (e.g., 10.x.x.x:9090)"
    echo "  POSTGRES_PASSWORD    - Secure password for database"
    echo "  CHAIN_ID             - Your chain ID (e.g., manifest-1)"
    echo "  CHAIN_NAME           - Display name for your chain"
    echo ""
    echo "After editing .env, run this script again to deploy."
    exit 0
else
    echo "  ✓ .env already configured"
fi

# Step 4: Verify .env has CHAIN_GRPC_ENDPOINT set
echo ""
echo "Step 4: Verifying configuration..."
GRPC_ENDPOINT=$(lxc_exec "grep '^CHAIN_GRPC_ENDPOINT=' ${INSTALL_PATH}/.env | cut -d= -f2")
if [ -z "$GRPC_ENDPOINT" ] || [ "$GRPC_ENDPOINT" = "host.docker.internal:9090" ]; then
    echo "❌ CHAIN_GRPC_ENDPOINT not configured!"
    echo ""
    echo "Please edit .env and set your chain's gRPC endpoint:"
    echo "  lxc exec ${CONTAINER_NAME} -- nano ${INSTALL_PATH}/.env"
    echo ""
    echo "Example: CHAIN_GRPC_ENDPOINT=10.123.45.2:9090"
    exit 1
fi
echo "  ✓ Chain endpoint: ${GRPC_ENDPOINT}"

# Step 5: Pull Docker images
echo ""
echo "Step 5: Pulling Docker images..."
lxc_exec "cd ${INSTALL_PATH} && docker compose -f docker/docker-compose.yml pull"
echo "  ✓ Images pulled"

# Step 6: Start services
echo ""
echo "Step 6: Starting services..."
lxc_exec "cd ${INSTALL_PATH} && docker compose -f docker/docker-compose.yml up -d"
echo "  ✓ Services started"

# Step 7: Wait for services to be ready
echo ""
echo "Step 7: Waiting for services to initialize..."
sleep 5

# Check if PostgreSQL is healthy
echo "  Checking PostgreSQL..."
for i in {1..30}; do
    if lxc_exec "cd ${INSTALL_PATH} && docker compose -f docker/docker-compose.yml exec -T postgres pg_isready -U postgres" &> /dev/null; then
        echo "  ✓ PostgreSQL ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "  ⚠️  PostgreSQL taking longer than expected"
    fi
    sleep 1
done

# Step 8: Show service status
echo ""
echo "Step 8: Service Status"
echo "=========================================="
lxc_exec "cd ${INSTALL_PATH} && docker compose -f docker/docker-compose.yml ps"

# Step 9: Setup port forwarding (if not already set up)
echo ""
echo "Step 9: Setting up port forwarding..."

# Check if explorer port proxy exists
if ! lxc config device show "${CONTAINER_NAME}" | grep -q "explorer-port"; then
    echo "  Adding explorer port proxy (3001)..."
    lxc config device add "${CONTAINER_NAME}" explorer-port proxy \
        listen=tcp:0.0.0.0:3001 \
        connect=tcp:127.0.0.1:3001 || echo "  (proxy may already exist)"
fi

# Check if API port proxy exists
if ! lxc config device show "${CONTAINER_NAME}" | grep -q "api-port"; then
    echo "  Adding API port proxy (3000)..."
    lxc config device add "${CONTAINER_NAME}" api-port proxy \
        listen=tcp:0.0.0.0:3000 \
        connect=tcp:127.0.0.1:3000 || echo "  (proxy may already exist)"
fi

echo "  ✓ Port forwarding configured"

# Step 10: Create systemd service for auto-start
echo ""
echo "Step 10: Setting up auto-start service..."
lxc_exec "cat > /etc/systemd/system/yaci-explorer.service << 'EOF'
[Unit]
Description=Yaci Block Explorer Stack
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${INSTALL_PATH}
ExecStart=/usr/bin/docker compose -f docker/docker-compose.yml up -d
ExecStop=/usr/bin/docker compose -f docker/docker-compose.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF"

lxc_exec "systemctl daemon-reload"
lxc_exec "systemctl enable yaci-explorer.service"
echo "  ✓ Auto-start service configured"

# Get host IP
HOST_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Access the explorer:"
echo "  http://${HOST_IP}:3001"
echo "  or"
echo "  http://localhost:3001 (from host)"
echo ""
echo "PostgREST API:"
echo "  http://${HOST_IP}:3000"
echo ""
echo "Container IP:"
echo "  ${CONTAINER_IP}"
echo ""
echo "Useful commands:"
echo ""
echo "  # View logs"
echo "  lxc exec ${CONTAINER_NAME} -- bash -c 'cd ${INSTALL_PATH} && docker compose -f docker/docker-compose.yml logs -f'"
echo ""
echo "  # Check status"
echo "  lxc exec ${CONTAINER_NAME} -- bash -c 'cd ${INSTALL_PATH} && docker compose -f docker/docker-compose.yml ps'"
echo ""
echo "  # Restart services"
echo "  lxc exec ${CONTAINER_NAME} -- bash -c 'cd ${INSTALL_PATH} && docker compose -f docker/docker-compose.yml restart'"
echo ""
echo "  # Shell into container"
echo "  lxc exec ${CONTAINER_NAME} -- bash"
echo ""
echo "  # Check database blocks"
echo "  lxc exec ${CONTAINER_NAME} -- bash -c 'cd ${INSTALL_PATH} && docker compose -f docker/docker-compose.yml exec postgres psql -U postgres -c \"SELECT COUNT(*) FROM api.blocks_raw;\"'"
echo ""
echo "=========================================="
