# LXC Deployment Guide

Complete guide for deploying yaci-explorer and mantrad node in separate LXC containers.

## Architecture

```
LXC Bridge (lxdbr0)
│
├── Container: mantrad (10.x.x.2)
│   ├── manifestd node
│   ├── gRPC: 9090
│   ├── RPC: 26657
│   └── REST: 1317
│
└── Container: yaci-indexer (10.x.x.3)
    ├── PostgreSQL: 5432
    ├── PostgREST: 3000
    ├── Yaci Indexer (connects to 10.x.x.2:9090)
    └── Explorer UI: 3001
```

## Prerequisites

- LXD/LXC installed on host
- Both containers on same bridge network
- Docker support for yaci-indexer container

## Part 1: Configure mantrad Container

### 1.1 Check Container Exists

```bash
# On host
lxc list | grep mantrad
```

### 1.2 Configure Container for Networking

```bash
# Enable nested containers (if needed for Docker)
lxc config set mantrad security.nesting true

# Get container IP
lxc list mantrad

# Example output:
# | mantrad | RUNNING | 10.123.45.2 (eth0) |
```

### 1.3 Login and Build/Configure Node

```bash
# Login to container
login mantrad

# Check if manifestd is built
which manifestd

# If not built, build it:
# (Adjust based on your build process)
cd /root
git clone https://github.com/liftedinit/manifest-ledger.git
cd manifest-ledger
make install

# Verify installation
manifestd version
```

### 1.4 Initialize Node

```bash
# Still in mantrad container

# Initialize node
manifestd init mynode --chain-id manifest-1

# Configure to listen on all interfaces (IMPORTANT!)
# Edit config.toml
nano ~/.manifestd/config/config.toml

# Find and modify these lines:
# laddr = "tcp://0.0.0.0:26657"  # RPC
# laddr = "tcp://0.0.0.0:26656"  # P2P

# Edit app.toml
nano ~/.manifestd/config/app.toml

# Find and modify:
# address = "0.0.0.0:9090"  # gRPC (CRITICAL for yaci indexer!)
# address = "0.0.0.0:1317"  # REST API

# Configure peers and genesis (based on your network)
# Add persistent peers to config.toml
# Download genesis.json if needed

# Start node (test mode first)
manifestd start

# Or use systemd service (recommended for production)
```

### 1.5 Create Systemd Service (Optional but Recommended)

```bash
# Still in mantrad container

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

systemctl daemon-reload
systemctl enable manifestd
systemctl start manifestd

# Check status
systemctl status manifestd

# View logs
journalctl -u manifestd -f
```

### 1.6 Verify Node is Accessible

```bash
# From mantrad container
netstat -tlnp | grep 9090
# Should show: tcp 0.0.0.0:9090 ... LISTEN

# Test gRPC locally
grpcurl -plaintext localhost:9090 list

# Exit container
exit
```

### 1.7 Test from Host

```bash
# On host, test connectivity to mantrad container
# Replace 10.123.45.2 with your actual mantrad IP
nc -zv 10.123.45.2 9090
nc -zv 10.123.45.2 26657

# Test gRPC (install grpcurl if needed)
grpcurl -plaintext 10.123.45.2:9090 list
```

---

## Part 2: Create yaci-indexer Container

### 2.1 Create Container

```bash
# On host
lxc launch ubuntu:22.04 yaci-indexer

# Configure for Docker
lxc config set yaci-indexer security.nesting true
lxc config set yaci-indexer security.syscalls.intercept.mknod true
lxc config set yaci-indexer security.syscalls.intercept.setxattr true

# Set resource limits
lxc config set yaci-indexer limits.memory 4GB
lxc config set yaci-indexer limits.cpu 2
lxc config set yaci-indexer limits.kernel.nofile 65536

# Restart to apply
lxc restart yaci-indexer

# Wait a moment
sleep 5

# Get IP address
lxc list yaci-indexer
# Example: 10.123.45.3
```

### 2.2 Setup Port Forwarding (for external access)

```bash
# On host - forward ports from host to container

# Explorer UI
lxc config device add yaci-indexer explorer-port proxy \
  listen=tcp:0.0.0.0:3001 \
  connect=tcp:127.0.0.1:3001

# PostgREST API (optional, for direct API access)
lxc config device add yaci-indexer api-port proxy \
  listen=tcp:0.0.0.0:3000 \
  connect=tcp:127.0.0.1:3000
```

### 2.3 Login and Install Docker

```bash
# Login to container
login yaci-indexer

# Update system
apt update && apt upgrade -y

# Install prerequisites
apt install -y curl git ca-certificates gnupg lsb-release

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version

# Test Docker works with nested containers
docker run --rm hello-world
# Should print "Hello from Docker!"
```

### 2.4 Clone and Configure Explorer

```bash
# Still in yaci-indexer container

cd /opt
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer

# Create environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Critical .env settings:**
```bash
# PostgreSQL
POSTGRES_PASSWORD=CHANGE_THIS_SECURE_PASSWORD

# IMPORTANT: Set this to your mantrad container IP!
CHAIN_GRPC_ENDPOINT=10.123.45.2:9090

# Use the fork with your modifications
YACI_IMAGE=ghcr.io/cordtus/yaci:poc

# Other settings
YACI_INSECURE=-k  # Use -k for insecure gRPC (no TLS)
CHAIN_ID=manifest-1
CHAIN_NAME=Manifest Network
```

### 2.5 Start the Stack

```bash
# Still in yaci-indexer container, in /opt/yaci-explorer

# Pull images first (to see any auth errors)
docker compose -f docker/docker-compose.yml pull

# Start all services
docker compose -f docker/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.yml logs -f

# Watch for:
# - PostgreSQL: "database system is ready to accept connections"
# - Yaci: "Starting extraction from block..."
# - Explorer: nginx started

# Check all containers are running
docker compose -f docker/docker-compose.yml ps
```

### 2.6 Monitor and Verify

```bash
# Check if indexer is connecting to node
docker compose -f docker/docker-compose.yml logs yaci | grep -i "block"

# Check database has data
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -c "SELECT COUNT(*) FROM api.blocks_raw;"

# Check PostgREST API
curl http://localhost:3000/blocks_raw?limit=1

# Exit container
exit
```

### 2.7 Access Explorer from Host

```bash
# On host machine

# Get host IP
hostname -I

# Access explorer at:
# http://<host-ip>:3001

# Test from command line
curl http://localhost:3001
# Should return HTML
```

---

## Part 3: Systemd Service for Auto-Start

Make the explorer stack start automatically on container boot.

```bash
# Login to yaci-indexer container
login yaci-indexer

cat > /etc/systemd/system/yaci-explorer.service << 'EOF'
[Unit]
Description=Yaci Block Explorer Stack
Requires=docker.service
After=docker.service network-online.target
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

# Enable and start
systemctl daemon-reload
systemctl enable yaci-explorer.service
systemctl start yaci-explorer.service

# Check status
systemctl status yaci-explorer.service

# Exit
exit
```

---

## Part 4: Maintenance Commands

### Check Status

```bash
# From host
login yaci-indexer
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml ps
exit
```

### View Logs

```bash
login yaci-indexer
cd /opt/yaci-explorer

# All services
docker compose -f docker/docker-compose.yml logs -f

# Specific service
docker compose -f docker/docker-compose.yml logs -f yaci
docker compose -f docker/docker-compose.yml logs -f explorer

exit
```

### Restart Services

```bash
login yaci-indexer
cd /opt/yaci-explorer

# Restart all
docker compose -f docker/docker-compose.yml restart

# Restart specific service
docker compose -f docker/docker-compose.yml restart yaci

exit
```

### Update to Latest Code

```bash
login yaci-indexer
cd /opt/yaci-explorer

# Pull latest changes
git pull origin main

# Pull latest Docker images
docker compose -f docker/docker-compose.yml pull

# Restart
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d

exit
```

### Database Backup

```bash
login yaci-indexer
cd /opt/yaci-explorer

# Backup database
docker compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U postgres postgres > backup-$(date +%Y%m%d).sql

# Or backup with Docker volume
docker run --rm --volumes-from yaci-explorer-postgres \
  -v $(pwd):/backup alpine \
  tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz /var/lib/postgresql/data

exit
```

### Clean Restart (wipe database)

```bash
login yaci-indexer
cd /opt/yaci-explorer

# WARNING: This deletes all indexed data!
docker compose -f docker/docker-compose.yml down -v

# Start fresh
docker compose -f docker/docker-compose.yml up -d

exit
```

---

## Part 5: Monitoring and Troubleshooting

### Check Connectivity Between Containers

```bash
# From yaci-indexer, test connection to mantrad
login yaci-indexer

# Install netcat if needed
apt install -y netcat-openbsd

# Test gRPC port
nc -zv 10.123.45.2 9090

# Test from within yaci container
docker compose -f /opt/yaci-explorer/docker/docker-compose.yml exec yaci \
  nc -zv 10.123.45.2 9090

exit
```

### Monitor Indexing Progress

```bash
login yaci-indexer

# Check latest indexed block
curl -s http://localhost:3000/blocks_raw?order=id.desc&limit=1 | jq '.[] | {id, height: .data.block.header.height}'

# Compare with node's latest block
# (from host, query mantrad)
curl -s http://10.123.45.2:26657/status | jq '.result.sync_info.latest_block_height'

exit
```

### Common Issues

**Issue: Yaci can't connect to node**
```bash
# Check mantrad is listening on 0.0.0.0:9090
login mantrad
netstat -tlnp | grep 9090
# Should show 0.0.0.0:9090, not 127.0.0.1:9090
exit

# Check firewall (if enabled)
login mantrad
ufw status
# If active, allow from yaci-indexer subnet:
ufw allow from 10.123.45.0/24 to any port 9090
exit
```

**Issue: Docker won't start in LXC**
```bash
# On host, ensure nesting is enabled
lxc config get yaci-indexer security.nesting
# Should return: true

# If not, enable and restart
lxc config set yaci-indexer security.nesting true
lxc restart yaci-indexer
```

**Issue: Can't access explorer from outside**
```bash
# Check port proxy is configured
lxc config device show yaci-indexer

# Should show explorer-port device
# If missing, add it:
lxc config device add yaci-indexer explorer-port proxy \
  listen=tcp:0.0.0.0:3001 \
  connect=tcp:127.0.0.1:3001
```

---

## Part 6: Production Hardening

### Secure PostgreSQL

```bash
login yaci-indexer
cd /opt/yaci-explorer

# Generate strong password
apt install -y pwgen
SECURE_PASSWORD=$(pwgen -s 32 1)

# Update .env
nano .env
# Change POSTGRES_PASSWORD=...

# Recreate containers
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d

exit
```

### Set Up Log Rotation

```bash
login yaci-indexer

# Configure Docker log rotation
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
systemctl restart yaci-explorer

exit
```

### Enable Firewall (Optional)

```bash
# On host
# Allow SSH
ufw allow 22/tcp

# Allow explorer
ufw allow 3001/tcp

# Enable
ufw enable
```

---

## Quick Reference

### Container IPs (example - yours will differ)
- **mantrad**: `10.123.45.2`
- **yaci-indexer**: `10.123.45.3`

### Access Points
- **Explorer UI**: `http://<host-ip>:3001`
- **PostgREST API**: `http://<host-ip>:3000`
- **Node RPC**: `http://10.123.45.2:26657`
- **Node gRPC**: `10.123.45.2:9090`

### Common Commands

```bash
# Login to containers
login mantrad
login yaci-indexer

# Check node status
login mantrad
systemctl status manifestd
exit

# Check explorer status
login yaci-indexer
systemctl status yaci-explorer
cd /opt/yaci-explorer && docker compose -f docker/docker-compose.yml ps
exit

# View logs
login yaci-indexer
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml logs -f yaci
exit

# Update explorer
login yaci-indexer
cd /opt/yaci-explorer
git pull && docker compose -f docker/docker-compose.yml pull
docker compose -f docker/docker-compose.yml up -d
exit
```

---

## Next Steps

1. ✅ Configure mantrad node
2. ✅ Create yaci-indexer container
3. ✅ Deploy explorer stack
4. Configure monitoring (Prometheus/Grafana)
5. Set up automated backups
6. Configure SSL/TLS with reverse proxy (nginx/caddy)
