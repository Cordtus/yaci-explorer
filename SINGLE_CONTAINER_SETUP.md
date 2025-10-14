# Single Container Setup

Deploy the entire stack (node + indexer + explorer) in one LXC container.

## Architecture

```
┌─────────────────────────────────────────────┐
│  LXC Container: yaci-all-in-one             │
│  (10.x.x.2)                                 │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ manifestd (native)                   │   │
│  │ gRPC: localhost:9090                 │   │
│  │ RPC: localhost:26657                 │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Docker Services:                            │
│  ┌──────────────────────────────────────┐   │
│  │ Explorer UI (nginx)                  │   │
│  │ → Port 3001                          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ PostgREST API                        │   │
│  │ → Port 3000                          │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ Yaci Indexer                         │   │
│  │ → Connects to host.docker.internal   │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ PostgreSQL                           │   │
│  │ → Port 5432                          │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Prerequisites

- LXC container with:
  - Docker installed
  - Nested containers enabled
  - manifestd built and configured

## Step 1: Create/Configure LXC Container

```bash
# On LXC host
lxc launch ubuntu:22.04 yaci-all-in-one

# Configure for Docker
lxc config set yaci-all-in-one security.nesting true
lxc config set yaci-all-in-one security.syscalls.intercept.mknod true
lxc config set yaci-all-in-one security.syscalls.intercept.setxattr true

# Set resource limits
lxc config set yaci-all-in-one limits.memory 8GB
lxc config set yaci-all-in-one limits.cpu 4

# Setup port forwarding to host
lxc config device add yaci-all-in-one explorer-port proxy \
  listen=tcp:0.0.0.0:3001 connect=tcp:127.0.0.1:3001

lxc config device add yaci-all-in-one api-port proxy \
  listen=tcp:0.0.0.0:3000 connect=tcp:127.0.0.1:3000

# Restart container
lxc restart yaci-all-in-one
```

## Step 2: Install Docker

```bash
# Login to container
login yaci-all-in-one

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

## Step 3: Install and Configure manifestd

```bash
# Still in container

# Install build dependencies
apt install -y build-essential git wget

# Install Go (if not already installed)
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
rm -rf /usr/local/go
tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc

# Clone and build manifestd
cd /root
git clone https://github.com/liftedinit/manifest-ledger.git
cd manifest-ledger
make install

# Verify
manifestd version
```

## Step 4: Initialize manifestd

```bash
# Initialize node
manifestd init mynode --chain-id manifest-1

# Download genesis
wget -O ~/.manifestd/config/genesis.json \
  https://github.com/liftedinit/manifest-ledger/raw/main/network/manifest-1/genesis.json

# Configure to listen on localhost (Docker containers will use host network)
nano ~/.manifestd/config/app.toml

# Find [grpc] section and set:
# address = "0.0.0.0:9090"

# Find [api] section and set:
# enable = true
# address = "tcp://0.0.0.0:1317"

# Save and exit

# Configure peers
nano ~/.manifestd/config/config.toml

# Set persistent_peers (get from chain documentation)
# Set laddr = "tcp://0.0.0.0:26657"

# Save and exit
```

## Step 5: Create systemd Service for manifestd

```bash
cat > /etc/systemd/system/manifestd.service << 'EOF'
[Unit]
Description=Manifest Network Node
After=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
ExecStart=/root/go/bin/manifestd start
Restart=on-failure
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start
systemctl enable manifestd
systemctl start manifestd

# Check status
systemctl status manifestd

# View logs
journalctl -u manifestd -f
```

**Wait for the node to sync** (this may take hours/days depending on chain height).

Check sync status:
```bash
manifestd status 2>&1 | jq .SyncInfo
```

## Step 6: Deploy Explorer Stack

```bash
# Clone explorer repository
cd /opt
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer

# Create configuration
cp .env.example .env
nano .env
```

### Critical .env Configuration

```bash
# IMPORTANT: Use host.docker.internal to reach the host's manifestd from Docker
CHAIN_GRPC_ENDPOINT=host.docker.internal:9090

# Security
POSTGRES_PASSWORD=CHANGE_TO_SECURE_PASSWORD

# Use your fork
YACI_IMAGE=ghcr.io/cordtus/yaci:poc

# Chain info
CHAIN_ID=manifest-1
CHAIN_NAME=Manifest Network

# Other defaults are fine
```

Save and exit.

## Step 7: Update docker-compose for Host Network Access

```bash
# Edit docker-compose to allow access to host
nano docker/docker-compose.yml
```

Add this to the `yaci` service (after line 67):

```yaml
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

The yaci service should look like:

```yaml
  yaci:
    image: ${YACI_IMAGE:-ghcr.io/manifest-network/yaci:latest}
    container_name: yaci-explorer-indexer
    command: >
      extract postgres ${CHAIN_GRPC_ENDPOINT}
      -p postgres://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-foobar}@postgres:5432/${POSTGRES_DB:-yaci}
      --live
      --max-concurrency ${YACI_MAX_CONCURRENCY:-100}
      ${YACI_INSECURE:+-k}
      --enable-prometheus
      --prometheus-addr 0.0.0.0:2112
      -l ${YACI_LOG_LEVEL:-info}
    environment:
      YACI_LOGLEVEL: ${YACI_LOG_LEVEL:-info}
    ports:
      - "${YACI_METRICS_PORT:-2112}:2112"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - yaci-network
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Save and exit.

## Step 8: Start Explorer Stack

```bash
# Pull images
docker compose -f docker/docker-compose.yml pull

# Start services
docker compose -f docker/docker-compose.yml up -d

# Watch logs
docker compose -f docker/docker-compose.yml logs -f
```

**Expected output:**
```
postgres      | database system is ready to accept connections
postgrest     | Listening on port 3000
yaci          | Connecting to host.docker.internal:9090
yaci          | Starting extraction from block 1
yaci          | Block 1 extracted successfully
explorer      | ready
```

Press Ctrl+C to stop watching (services keep running).

## Step 9: Verify Everything Works

```bash
# Check manifestd is running
systemctl status manifestd

# Check Docker services
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml ps
# All should be "Up"

# Test gRPC connection from inside yaci container
docker compose -f docker/docker-compose.yml exec yaci sh -c "nc -zv host.docker.internal 9090"
# Should succeed

# Check database has data
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d yaci -c "SELECT COUNT(*) FROM api.blocks_raw;"

# Test PostgREST API
curl http://localhost:3000/blocks_raw?limit=1

# Test Explorer UI
curl http://localhost:3001
```

## Step 10: Access from Outside

From your local machine:
```
http://<lxc-host-ip>:3001
```

## Auto-Start on Boot

### manifestd (already configured in Step 5)
```bash
systemctl enable manifestd
```

### Explorer Stack
```bash
cat > /etc/systemd/system/yaci-explorer.service << 'EOF'
[Unit]
Description=Yaci Block Explorer Stack
Requires=docker.service manifestd.service
After=docker.service network-online.target manifestd.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/yaci-explorer
ExecStart=/usr/bin/docker compose -f docker/docker-compose.yml up -d
ExecStop=/usr/bin/docker compose -f docker/docker-compose.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable yaci-explorer.service
```

## Management Commands

### Check Status
```bash
# Node status
systemctl status manifestd
manifestd status 2>&1 | jq .SyncInfo

# Explorer stack
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml ps
```

### View Logs
```bash
# Node logs
journalctl -u manifestd -f

# Explorer logs
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml logs -f yaci
```

### Restart Services
```bash
# Restart node
systemctl restart manifestd

# Restart explorer stack
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml restart

# Restart specific service
docker compose -f docker/docker-compose.yml restart yaci
```

### Stop Everything
```bash
# Stop explorer
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml down

# Stop node
systemctl stop manifestd
```

### Update Explorer
```bash
cd /opt/yaci-explorer
git pull
docker compose -f docker/docker-compose.yml pull
docker compose -f docker/docker-compose.yml up -d
```

## Monitoring

### Check Sync Progress
```bash
# Get current block height
manifestd status 2>&1 | jq .SyncInfo.latest_block_height

# Check indexer progress
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d yaci -c "SELECT MAX((data->'block'->'header'->>'height')::int) FROM api.blocks_raw;"

# Check if syncing
manifestd status 2>&1 | jq .SyncInfo.catching_up
# Should be "false" when fully synced
```

### Monitor Resources
```bash
# Container resource usage
docker stats

# Node resource usage
htop
```

## Troubleshooting

### Yaci can't connect to manifestd

```bash
# Test from inside yaci container
docker compose -f docker/docker-compose.yml exec yaci sh -c "nc -zv host.docker.internal 9090"

# If fails, check manifestd is listening
netstat -tlnp | grep 9090
# Should show 0.0.0.0:9090

# Check manifestd is running
systemctl status manifestd

# Check firewall
ufw status
# If active, ensure it's not blocking localhost
```

### manifestd won't start

```bash
# Check logs
journalctl -u manifestd -n 100 --no-pager

# Common issues:
# - Corrupted database: rm -rf ~/.manifestd/data && manifestd unsafe-reset-all
# - Bad genesis: re-download genesis.json
# - Peer connection issues: check persistent_peers in config.toml
```

### Explorer shows no data

```bash
# Check yaci logs
docker compose -f docker/docker-compose.yml logs yaci

# Check manifestd is synced
manifestd status 2>&1 | jq .SyncInfo.catching_up
# Must be "false"

# Check database
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d yaci -c "SELECT COUNT(*) FROM api.blocks_raw;"
```

## Performance Tips

1. **SSD Required**: Store blockchain data on SSD for acceptable sync times
2. **RAM**: 8GB minimum, 16GB recommended
3. **Indexer Concurrency**: Increase `YACI_MAX_CONCURRENCY` to 200 if node can handle it
4. **Pruning**: Enable state pruning in manifestd config if you don't need full history

## Backup

```bash
# Backup node state
tar czf manifestd-backup-$(date +%Y%m%d).tar.gz ~/.manifestd

# Backup explorer database
docker compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U postgres yaci > yaci-backup-$(date +%Y%m%d).sql
```

## Quick Setup Script

Save this as `setup-single-container.sh`:

```bash
#!/bin/bash
set -e

echo "Installing Docker..."
curl -fsSL https://get.docker.com | sh

echo "Cloning explorer..."
cd /opt
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer

echo "Creating config..."
cp .env.example .env

echo "DONE! Now:"
echo "1. Edit /opt/yaci-explorer/.env (set CHAIN_GRPC_ENDPOINT and POSTGRES_PASSWORD)"
echo "2. Setup and start manifestd"
echo "3. Run: docker compose -f docker/docker-compose.yml up -d"
```

Make executable and run:
```bash
chmod +x setup-single-container.sh
./setup-single-container.sh
```
