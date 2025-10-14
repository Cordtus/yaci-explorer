# Native Setup (No Docker)

Run everything natively in a single LXC container without Docker.

## Architecture

```
┌─────────────────────────────────────────┐
│  LXC Container                          │
│                                          │
│  manifestd (systemd)                    │
│  ├─ gRPC: localhost:9090                │
│  └─ RPC: localhost:26657                │
│                                          │
│  PostgreSQL (systemd)                   │
│  └─ Port: 5432                          │
│                                          │
│  PostgREST (systemd)                    │
│  └─ Port: 3000                          │
│                                          │
│  Yaci Indexer (systemd)                 │
│  └─ Connects to localhost:9090          │
│                                          │
│  Explorer UI (nginx)                    │
│  └─ Port: 3001                          │
└─────────────────────────────────────────┘
```

## Prerequisites

Fresh Ubuntu 22.04 LXC container.

## Step 1: Create LXC Container

```bash
# On LXC host
lxc launch ubuntu:22.04 yaci

# Configure port forwarding
lxc config device add yaci explorer-port proxy \
  listen=tcp:0.0.0.0:3001 connect=tcp:127.0.0.1:3001

lxc config device add yaci api-port proxy \
  listen=tcp:0.0.0.0:3000 connect=tcp:127.0.0.1:3000

# Login
login yaci
```

## Step 2: Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install build tools
apt install -y build-essential git wget curl

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install nginx
apt install -y nginx

# Install Go
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
rm -rf /usr/local/go
tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version
psql --version
nginx -v
```

## Step 3: Setup PostgreSQL

```bash
# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE yaci;
CREATE USER yaci WITH ENCRYPTED PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE yaci TO yaci;
\c yaci
GRANT ALL ON SCHEMA public TO yaci;
EOF

# Verify
sudo -u postgres psql -d yaci -c '\dt'
```

## Step 4: Install PostgREST

```bash
# Download PostgREST binary
cd /tmp
wget https://github.com/PostgREST/postgrest/releases/download/v12.0.2/postgrest-v12.0.2-linux-static-x64.tar.xz
tar xf postgrest-v12.0.2-linux-static-x64.tar.xz
mv postgrest /usr/local/bin/
chmod +x /usr/local/bin/postgrest

# Verify
postgrest --help
```

## Step 5: Build and Install Yaci

```bash
# Clone yaci repository (your fork)
cd /opt
git clone https://github.com/Cordtus/yaci.git
cd yaci

# Build
make build

# Install binary
cp bin/yaci /usr/local/bin/
chmod +x /usr/local/bin/yaci

# Verify
yaci version
```

## Step 6: Setup manifestd

```bash
# Clone and build manifest-ledger
cd /opt
git clone https://github.com/liftedinit/manifest-ledger.git
cd manifest-ledger
make install

# Verify
manifestd version

# Initialize
manifestd init mynode --chain-id manifest-1

# Download genesis
wget -O ~/.manifestd/config/genesis.json \
  https://github.com/liftedinit/manifest-ledger/raw/main/network/manifest-1/genesis.json

# Configure app.toml
nano ~/.manifestd/config/app.toml

# Set in [grpc] section:
# address = "127.0.0.1:9090"

# Set in [api] section:
# enable = true
# address = "tcp://127.0.0.1:1317"

# Configure config.toml
nano ~/.manifestd/config/config.toml

# Set persistent_peers (from chain docs)
# Set laddr = "tcp://127.0.0.1:26657"
```

## Step 7: Initialize Yaci Database Schema

```bash
# Clone yaci-explorer for database migrations
cd /opt
git clone https://github.com/Cordtus/yaci-explorer.git

# Get migrations from yaci repo
cd /opt/yaci/internal/output/postgresql/migrations

# Apply migrations manually
sudo -u postgres psql -d yaci << 'EOF'
-- Create api schema
CREATE SCHEMA IF NOT EXISTS api;
GRANT ALL ON SCHEMA api TO yaci;

-- You'll need to run all migration files in order
-- List them:
EOF

# Apply each migration file in order
for f in $(ls -1 *.up.sql | sort); do
  echo "Applying $f..."
  sudo -u postgres psql -d yaci -f "$f"
done
```

## Step 8: Create PostgREST Configuration

```bash
mkdir -p /etc/postgrest
cat > /etc/postgrest/config.conf << 'EOF'
db-uri = "postgres://yaci:CHANGE_THIS_PASSWORD@localhost:5432/yaci"
db-schemas = "api"
db-anon-role = "yaci"
db-pool = 10
server-port = 3000
EOF

# Secure config file
chmod 600 /etc/postgrest/config.conf
```

## Step 9: Create Systemd Services

### manifestd Service

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
```

### PostgREST Service

```bash
cat > /etc/systemd/system/postgrest.service << 'EOF'
[Unit]
Description=PostgREST API Server
After=postgresql.service
Requires=postgresql.service

[Service]
Type=simple
ExecStart=/usr/local/bin/postgrest /etc/postgrest/config.conf
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

### Yaci Indexer Service

```bash
cat > /etc/systemd/system/yaci.service << 'EOF'
[Unit]
Description=Yaci Blockchain Indexer
After=postgresql.service manifestd.service
Requires=postgresql.service
Wants=manifestd.service

[Service]
Type=simple
ExecStart=/usr/local/bin/yaci extract postgres localhost:9090 \
  -p postgres://yaci:CHANGE_THIS_PASSWORD@localhost:5432/yaci \
  --live \
  --max-concurrency 100 \
  -k \
  --enable-prometheus \
  --prometheus-addr 127.0.0.1:2112 \
  -l info
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

**IMPORTANT**: Replace `CHANGE_THIS_PASSWORD` in all service files with your actual PostgreSQL password.

## Step 10: Build Explorer Frontend

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
node --version
npm --version

# Build explorer
cd /opt/yaci-explorer
npm install
npm run build

# The build output is in build/client/
```

## Step 11: Configure Nginx

```bash
cat > /etc/nginx/sites-available/yaci-explorer << 'EOF'
server {
    listen 3001;
    server_name _;

    root /opt/yaci-explorer/build/client;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Metrics proxy (optional)
    location /metrics {
        proxy_pass http://127.0.0.1:2112/metrics;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/yaci-explorer /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Reload nginx
systemctl reload nginx
systemctl enable nginx
```

## Step 12: Start Services

```bash
# Reload systemd
systemctl daemon-reload

# Start manifestd first (will take time to sync)
systemctl start manifestd
systemctl enable manifestd

# Check manifestd is syncing
journalctl -u manifestd -f
# Wait until you see blocks being produced

# Start PostgreSQL (should already be running)
systemctl start postgresql
systemctl enable postgresql

# Start PostgREST
systemctl start postgrest
systemctl enable postgrest

# Wait for manifestd to sync enough blocks
# Check sync status:
manifestd status 2>&1 | jq .SyncInfo.catching_up
# When this shows "false", manifestd is synced

# Start yaci indexer
systemctl start yaci
systemctl enable yaci

# Check services
systemctl status manifestd postgrest yaci nginx
```

## Step 13: Update Explorer API URL

```bash
# The explorer needs to know where the API is
# Update the built files to use the correct API URL
cd /opt/yaci-explorer/build/client

# Find and update any hardcoded localhost:3000 references
# This depends on how the app was built
# You may need to set environment variables before building

# Rebuild with correct API URL
cd /opt/yaci-explorer
VITE_POSTGREST_URL=http://localhost:3000 npm run build

# Copy to nginx
rsync -av build/client/ /opt/yaci-explorer/build/client/
systemctl reload nginx
```

## Step 14: Verify Everything

```bash
# Check all services running
systemctl status manifestd
systemctl status postgresql
systemctl status postgrest
systemctl status yaci
systemctl status nginx

# Check manifestd sync
manifestd status 2>&1 | jq .SyncInfo

# Check PostgREST API
curl http://localhost:3000/blocks_raw?limit=1

# Check database has data
sudo -u postgres psql -d yaci -c "SELECT COUNT(*) FROM api.blocks_raw;"

# Check explorer UI
curl http://localhost:3001
```

## Step 15: Access from Outside

From your local machine:
```
http://<lxc-host-ip>:3001
```

## Management Commands

### View Logs

```bash
# manifestd
journalctl -u manifestd -f

# yaci indexer
journalctl -u yaci -f

# postgrest
journalctl -u postgrest -f

# nginx
tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
systemctl restart manifestd
systemctl restart yaci
systemctl restart postgrest
systemctl restart nginx
```

### Check Status

```bash
# All services
systemctl status manifestd postgrest yaci nginx

# Sync status
manifestd status 2>&1 | jq .SyncInfo

# Database stats
sudo -u postgres psql -d yaci -c "
SELECT
  COUNT(*) as total_blocks,
  MAX((data->'block'->'header'->>'height')::int) as latest_block
FROM api.blocks_raw;
"
```

### Update Explorer

```bash
cd /opt/yaci-explorer
git pull
npm install
npm run build
systemctl reload nginx
```

### Update Yaci Indexer

```bash
cd /opt/yaci
git pull
make build
systemctl stop yaci
cp bin/yaci /usr/local/bin/
systemctl start yaci
```

## Troubleshooting

### Yaci won't connect to manifestd

```bash
# Check manifestd is running
systemctl status manifestd

# Check manifestd gRPC is listening
netstat -tlnp | grep 9090

# Check from yaci service
journalctl -u yaci -n 50
```

### No data in database

```bash
# Check yaci is running
systemctl status yaci

# Check yaci logs
journalctl -u yaci -f

# Verify manifestd is synced
manifestd status 2>&1 | jq .SyncInfo.catching_up
# Must be "false"
```

### PostgREST errors

```bash
# Check logs
journalctl -u postgrest -f

# Test database connection
sudo -u postgres psql -d yaci -c "SELECT * FROM api.blocks_raw LIMIT 1;"

# Verify schema exists
sudo -u postgres psql -d yaci -c "\dn"
```

### Explorer not loading

```bash
# Check nginx
systemctl status nginx
nginx -t

# Check nginx logs
tail -f /var/log/nginx/error.log

# Verify build exists
ls -la /opt/yaci-explorer/build/client/
```

## Performance Optimization

### PostgreSQL Tuning

```bash
# Edit postgresql.conf
nano /etc/postgresql/14/main/postgresql.conf

# Recommended settings (adjust based on available RAM):
# shared_buffers = 2GB
# effective_cache_size = 6GB
# maintenance_work_mem = 512MB
# checkpoint_completion_target = 0.9
# wal_buffers = 16MB
# default_statistics_target = 100
# random_page_cost = 1.1
# work_mem = 16MB
# max_wal_size = 4GB

# Restart PostgreSQL
systemctl restart postgresql
```

### Yaci Concurrency

```bash
# Edit yaci service
systemctl edit yaci

# Increase max-concurrency to 200
# Save and restart
systemctl restart yaci
```

## Backup

```bash
# Backup PostgreSQL
sudo -u postgres pg_dump yaci > yaci-backup-$(date +%Y%m%d).sql

# Backup manifestd
tar czf manifestd-backup-$(date +%Y%m%d).tar.gz ~/.manifestd

# Restore PostgreSQL
sudo -u postgres psql yaci < yaci-backup-20250114.sql
```

## Quick Setup Script

```bash
#!/bin/bash
set -e

echo "This script sets up yaci-explorer natively (no Docker)"
read -p "Press enter to continue..."

# Install dependencies
apt update
apt install -y postgresql postgresql-contrib nginx git build-essential wget curl

# Install Go
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Clone repos
cd /opt
git clone https://github.com/Cordtus/yaci.git
git clone https://github.com/Cordtus/yaci-explorer.git

# Build yaci
cd /opt/yaci
make build
cp bin/yaci /usr/local/bin/

# Install PostgREST
cd /tmp
wget https://github.com/PostgREST/postgrest/releases/download/v12.0.2/postgrest-v12.0.2-linux-static-x64.tar.xz
tar xf postgrest-v12.0.2-linux-static-x64.tar.xz
mv postgrest /usr/local/bin/

echo "Done! Now:"
echo "1. Setup manifestd"
echo "2. Configure PostgreSQL (see Step 3)"
echo "3. Apply migrations (see Step 7)"
echo "4. Create systemd services (see Step 9)"
echo "5. Build explorer (see Step 10)"
```

## Environment Variables

You can create a config file for common settings:

```bash
# Create /etc/yaci/config
mkdir -p /etc/yaci
cat > /etc/yaci/config << 'EOF'
YACI_CHAIN_GRPC=localhost:9090
YACI_POSTGRES_URI=postgres://yaci:CHANGE_PASSWORD@localhost:5432/yaci
YACI_LOG_LEVEL=info
YACI_MAX_CONCURRENCY=100
EOF
```

Then source it in the systemd service file.
