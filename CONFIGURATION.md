# Configuration Guide

## Step 1: Get Your Container IPs

First, find your LXC container IP addresses:

```bash
# On your LXC host
lxc list

# Example output:
# | NAME          | STATE   | IPV4           |
# | mantrad       | RUNNING | 10.123.45.2    |
# | yaci-indexer  | RUNNING | 10.123.45.3    |
```

**Write these down:**
- mantrad IP: `__________________`
- yaci-indexer IP: `__________________`

## Step 2: Verify mantrad is Ready

```bash
# Login to mantrad container
login mantrad

# Check manifestd is running
systemctl status manifestd
# OR if not using systemd:
ps aux | grep manifestd

# CRITICAL: Verify gRPC is listening on 0.0.0.0 (not 127.0.0.1)
netstat -tlnp | grep 9090
# Should show: tcp  0.0.0.0:9090  ...  LISTEN
# NOT:         tcp  127.0.0.1:9090 ... LISTEN

# If it shows 127.0.0.1, you need to fix app.toml:
nano ~/.manifestd/config/app.toml
# Find the [grpc] section and change:
# address = "0.0.0.0:9090"
# Then restart: systemctl restart manifestd

exit
```

## Step 3: Setup yaci-indexer Container

```bash
# Login to yaci-indexer container
login yaci-indexer

# Clone the repository
cd /opt
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer

# Create configuration file from template
cp .env.example .env
```

## Step 4: Edit Configuration

```bash
nano .env
```

**Required changes** (replace values with your actual setup):

```bash
# ============================================
# CHAIN CONNECTION - REQUIRED
# ============================================
# Replace with your mantrad container IP from Step 1
CHAIN_GRPC_ENDPOINT=10.123.45.2:9090

# Chain identifiers (match your chain)
CHAIN_ID=manifest-1
CHAIN_NAME=Manifest Network

# ============================================
# SECURITY - REQUIRED
# ============================================
# Change this to a strong password!
POSTGRES_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD

# ============================================
# INDEXER IMAGE - REQUIRED
# ============================================
# Use your fork with modifications
YACI_IMAGE=ghcr.io/cordtus/yaci:poc

# ============================================
# OPTIONAL SETTINGS
# ============================================
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_DB=yaci
POSTGRES_PORT=5432

# PostgREST API
PGRST_DB_SCHEMA=api
POSTGREST_PORT=3000
POSTGREST_URL=http://localhost:3000
POSTGREST_PROXY_URI=http://localhost:3000

# Yaci Indexer
YACI_MAX_CONCURRENCY=100
YACI_LOG_LEVEL=info
YACI_INSECURE=-k
YACI_METRICS_PORT=2112

# Explorer UI
EXPLORER_PORT=3001

# Development
NODE_ENV=production
```

**Save and exit** (Ctrl+X, Y, Enter)

## Step 5: Verify Configuration

```bash
# Still in /opt/yaci-explorer

# Test connection to mantrad
nc -zv 10.123.45.2 9090
# Should say: Connection to 10.123.45.2 9090 port [tcp/*] succeeded!

# If nc is not installed:
apt install -y netcat-openbsd

# Test gRPC endpoint (if grpcurl installed)
grpcurl -plaintext 10.123.45.2:9090 list
# Should list available gRPC services

# If grpcurl not installed, skip this test
```

## Step 6: Start the Stack

```bash
# Still in /opt/yaci-explorer

# Pull images (this may take a few minutes first time)
docker compose -f docker/docker-compose.yml pull

# Start all services
docker compose -f docker/docker-compose.yml up -d

# Watch the startup
docker compose -f docker/docker-compose.yml logs -f
```

**What to look for in logs:**

```
postgres      | database system is ready to accept connections
postgrest     | Listening on port 3000
yaci          | Starting extraction from block...
yaci          | Block 12345 extracted successfully
explorer      | [nginx] ready
```

Press Ctrl+C to stop watching logs (services keep running).

## Step 7: Verify Everything Works

```bash
# Check all containers are running
docker compose -f docker/docker-compose.yml ps
# All should show "Up" status

# Check database has data (wait a few seconds for first blocks)
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d yaci -c "SELECT COUNT(*) FROM api.blocks_raw;"
# Should show a number > 0

# Test PostgREST API
curl http://localhost:3000/blocks_raw?limit=1
# Should return JSON with block data

# Test Explorer UI
curl http://localhost:3001
# Should return HTML

# Exit container
exit
```

## Step 8: Configure Host Port Forwarding

```bash
# On your LXC host (not in containers)

# Forward explorer port from host to container
lxc config device add yaci-indexer explorer-port proxy \
  listen=tcp:0.0.0.0:3001 \
  connect=tcp:127.0.0.1:3001

# Forward API port (optional, for direct API access)
lxc config device add yaci-indexer api-port proxy \
  listen=tcp:0.0.0.0:3000 \
  connect=tcp:127.0.0.1:3000

# Verify port forwarding
lxc config device show yaci-indexer
```

## Step 9: Access Your Explorer

From any machine on your network:

```
http://<your-lxc-host-ip>:3001
```

To find your LXC host IP:
```bash
# On the LXC host
hostname -I | awk '{print $1}'
```

## Configuration Reference

### Minimal Required Configuration

Only these 3 settings are absolutely required:

```bash
CHAIN_GRPC_ENDPOINT=10.123.45.2:9090  # Your mantrad IP
POSTGRES_PASSWORD=secure_password_here # Change default
YACI_IMAGE=ghcr.io/cordtus/yaci:poc   # Your fork
```

### For Different Chains

If indexing a different chain (not Manifest):

```bash
CHAIN_ID=your-chain-id              # From genesis.json
CHAIN_NAME=Your Chain Name          # Display name
CHAIN_GRPC_ENDPOINT=your-node:9090  # Your node's gRPC endpoint
```

### Performance Tuning

```bash
# Faster indexing (if node can handle it)
YACI_MAX_CONCURRENCY=200

# More verbose logging for debugging
YACI_LOG_LEVEL=debug

# Less verbose for production
YACI_LOG_LEVEL=warn
```

### Using Local Development Yaci Build

If you built yaci locally and want to test:

```bash
# On your dev machine, build and tag
cd /path/to/yaci
docker build -t yaci:local -f docker/Dockerfile .

# Copy to LXC container
docker save yaci:local | gzip > yaci-local.tar.gz
scp yaci-local.tar.gz root@lxc-host:/tmp/

# On LXC host
lxc file push /tmp/yaci-local.tar.gz yaci-indexer/tmp/

# In yaci-indexer container
login yaci-indexer
docker load < /tmp/yaci-local.tar.gz

# Update .env
YACI_IMAGE=yaci:local

# Restart
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml restart yaci
```

## Troubleshooting Configuration

### Can't connect to mantrad

```bash
# On yaci-indexer container
nc -zv <mantrad-ip> 9090

# If fails, check from mantrad:
login mantrad
netstat -tlnp | grep 9090
# Must show 0.0.0.0:9090, not 127.0.0.1:9090

# Fix in app.toml:
nano ~/.manifestd/config/app.toml
# [grpc]
# address = "0.0.0.0:9090"

systemctl restart manifestd
```

### Services won't start

```bash
# Check logs
docker compose -f docker/docker-compose.yml logs

# Check specific service
docker compose -f docker/docker-compose.yml logs postgres
docker compose -f docker/docker-compose.yml logs yaci

# Restart specific service
docker compose -f docker/docker-compose.yml restart yaci
```

### No data in database

```bash
# Check yaci is running
docker compose -f docker/docker-compose.yml ps yaci

# Check yaci logs
docker compose -f docker/docker-compose.yml logs -f yaci

# Look for errors like:
# - "connection refused" → mantrad not accessible
# - "rpc error" → wrong gRPC endpoint
# - "database error" → wrong postgres password
```

### Can't access from outside

```bash
# On LXC host, verify port forwarding
lxc config device show yaci-indexer

# Should show explorer-port device
# If missing, add it (Step 8)

# Test from host
curl http://localhost:3001

# Check firewall (if enabled)
ufw status
# If active and blocking:
ufw allow 3001/tcp
```

## Quick Reference

**Check status:**
```bash
login yaci-indexer
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml ps
exit
```

**View logs:**
```bash
login yaci-indexer
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml logs -f yaci
exit
```

**Restart services:**
```bash
login yaci-indexer
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml restart
exit
```

**Stop everything:**
```bash
login yaci-indexer
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml down
exit
```

**Complete reset (deletes database!):**
```bash
login yaci-indexer
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
exit
```
