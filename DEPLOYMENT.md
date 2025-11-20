# Deployment Guide

This guide covers deploying the Yaci Explorer stack for any Cosmos SDK chain using either Docker or native installation.

## Prerequisites

### For Docker Deployment
- Docker and Docker Compose installed
- Access to your chain's gRPC endpoint (typically port 9090)
- At least 4GB RAM and 20GB disk space

### For Native Deployment
- PostgreSQL 18
- Node.js 20+
- Go 1.24+ (for Yaci indexer)
- Access to your chain's gRPC endpoint

---

## Option 1: Docker Deployment (Recommended)

### Step 1: Configure Environment

Copy and edit the environment template:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```bash
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password-here>
POSTGRES_DB=yaci

# Chain Configuration (REQUIRED)
CHAIN_GRPC_ENDPOINT=<your-chain-grpc-host>:9090

# Indexer Settings
YACI_MAX_CONCURRENCY=100
YACI_LOG_LEVEL=info
YACI_INSECURE=-k  # Use -k for non-TLS, remove for TLS

# Chain Metadata (optional - will auto-detect)
CHAIN_ID=<chain-id>
CHAIN_NAME=<Chain Name>

# Branding (optional)
VITE_APP_NAME=<Chain> Explorer
VITE_APP_NAME_SHORT=<Chain>
# VITE_LOGO_URL=/path/to/logo.png
# VITE_PRIMARY_COLOR=210 100% 50%
```

### Step 2: Start Services

Launch the complete stack:

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts:
- **PostgreSQL 18**: Database for indexed data
- **PostgREST**: REST API (port 3000)
- **Yaci Indexer**: Blockchain indexer
- **Explorer UI**: Web interface (port 3001)

### Step 3: Monitor Indexing

Watch the indexer logs:

```bash
docker compose -f docker/docker-compose.yml logs -f yaci
```

Expected output:
```
INFO extracting blocks from chain
INFO indexed block height=1 txs=0
INFO indexed block height=2 txs=5
```

### Step 4: Access Explorer

Once indexing starts:
- **Explorer UI**: http://localhost:3001
- **PostgREST API**: http://localhost:3000
- **Prometheus Metrics**: http://localhost:2112/metrics

### Managing Docker Deployment

**Stop services:**
```bash
docker compose -f docker/docker-compose.yml down
```

**View logs:**
```bash
docker compose -f docker/docker-compose.yml logs <service-name>
# Examples: yaci, postgres, postgrest, explorer
```

**Restart a service:**
```bash
docker compose -f docker/docker-compose.yml restart <service-name>
```

**Update indexer image:**
```bash
docker compose -f docker/docker-compose.yml pull yaci
docker compose -f docker/docker-compose.yml up -d yaci
```

**Reset all data:**
```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```
⚠️ This deletes all indexed blockchain data.

---

## Option 2: Native Deployment

### Step 1: Install PostgreSQL 18

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-18 postgresql-contrib-18
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql@18
brew services start postgresql@18
```

Create database and user:
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE yaci;
CREATE USER yaci_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE yaci TO yaci_user;
\q
```

### Step 2: Install and Run Yaci Indexer

**Build from source:**
```bash
git clone https://github.com/Cordtus/yaci.git
cd yaci
go build -o yaci cmd/yaci/main.go
```

**Run indexer:**
```bash
./yaci extract postgres <your-chain-grpc-host>:9090 \
  -p "postgres://yaci_user:your-password@localhost:5432/yaci" \
  --live \
  --max-concurrency 100 \
  -k \
  --enable-prometheus \
  --prometheus-addr 0.0.0.0:2112 \
  -l info
```

For non-TLS gRPC, include `-k` flag. For TLS, omit it.

**Run as systemd service:**

Create `/etc/systemd/system/yaci.service`:
```ini
[Unit]
Description=Yaci Blockchain Indexer
After=network.target postgresql.service

[Service]
Type=simple
User=yaci
WorkingDirectory=/opt/yaci
ExecStart=/opt/yaci/yaci extract postgres <grpc-host>:9090 \
  -p "postgres://yaci_user:password@localhost:5432/yaci" \
  --live --max-concurrency 100 -k \
  --enable-prometheus --prometheus-addr 0.0.0.0:2112 -l info
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable yaci
sudo systemctl start yaci
sudo systemctl status yaci
```

### Step 3: Install and Run PostgREST

**Download PostgREST:**
```bash
wget https://github.com/PostgREST/postgrest/releases/download/v12.0.2/postgrest-v12.0.2-linux-static-x64.tar.xz
tar xf postgrest-v12.0.2-linux-static-x64.tar.xz
sudo mv postgrest /usr/local/bin/
```

**Create config file** (`postgrest.conf`):
```ini
db-uri = "postgres://yaci_user:your-password@localhost:5432/yaci"
db-schemas = "api"
db-anon-role = "yaci_user"
server-port = 3000
```

**Run PostgREST:**
```bash
postgrest postgrest.conf
```

**Run as systemd service:**

Create `/etc/systemd/system/postgrest.service`:
```ini
[Unit]
Description=PostgREST API Server
After=network.target postgresql.service

[Service]
Type=simple
User=postgrest
ExecStart=/usr/local/bin/postgrest /etc/postgrest.conf
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable postgrest
sudo systemctl start postgrest
```

### Step 4: Build and Deploy Explorer UI

**Install dependencies:**
```bash
cd yaci-explorer
yarn install --production=false
```

**Configure environment:**
```bash
export VITE_POSTGREST_URL=http://localhost:3000
export VITE_APP_NAME="Your Chain Explorer"
```

**Build production bundle:**
```bash
yarn build
```

**Serve with static file server:**

**Option A: Using serve:**
```bash
yarn global add serve
serve -s build/client -l 3001
```

**Option B: Using Nginx:**

Install Nginx:
```bash
sudo apt install nginx
```

Configure Nginx (`/etc/nginx/sites-available/explorer`):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/yaci-explorer/build/client;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # API proxy
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/explorer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Option C: Using Caddy:**

Use the included Caddyfile:
```bash
sudo apt install caddy
sudo cp Caddyfile /etc/caddy/Caddyfile
# Edit domain in Caddyfile
sudo systemctl restart caddy
```

---

## Configuration

### Chain Auto-Detection

The explorer automatically detects:
- Chain ID from blockchain
- Native denomination from transactions
- Decimal places from denom prefix (`u` = 6, `a` = 18)
- Available message types from indexed data

### Custom Chain Configuration

Add your chain to `src/config/chains.ts` for better recognition:

```typescript
'your-chain-id': {
  name: 'Your Chain Name',
  features: {
    evm: false,      // Has EVM module?
    ibc: true,       // Has IBC support?
    wasm: false,     // Has CosmWasm?
  },
  nativeDenom: 'utoken',
  nativeSymbol: 'TOKEN',
  decimals: 6,
  rpcEndpoint: 'https://rpc.example.com',
  restEndpoint: 'https://api.example.com',
}
```

Rebuild the explorer after editing:
```bash
yarn build
```

### Branding Customization

Edit `.env` (Docker) or set environment variables (native):

```bash
# Application name
VITE_APP_NAME=Your Chain Explorer
VITE_APP_NAME_SHORT=Explorer

# Custom logo and favicon
VITE_LOGO_URL=https://your-cdn.com/logo.png
VITE_FAVICON_URL=https://your-cdn.com/favicon.ico

# Theme colors (HSL format)
VITE_PRIMARY_COLOR=210 100% 50%
VITE_ACCENT_COLOR=160 100% 45%

# Social links
VITE_LINK_WEBSITE=https://yourchain.com
VITE_LINK_GITHUB=https://github.com/yourchain
VITE_LINK_DISCORD=https://discord.gg/yourchain
VITE_LINK_TWITTER=https://twitter.com/yourchain
```

Then rebuild the explorer.

---

## Production Best Practices

### Security

**1. Use strong passwords:**
```bash
POSTGRES_PASSWORD=$(openssl rand -base64 32)
```

**2. Enable HTTPS:**
- Use Caddy (automatic HTTPS) or Nginx with Let's Encrypt
- Update `VITE_POSTGREST_URL=/api` for relative URLs

**3. Restrict database access:**
```bash
# PostgreSQL pg_hba.conf
host    yaci    yaci_user    127.0.0.1/32    scram-sha-256
```

**4. Firewall rules:**
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp  # PostgreSQL (local only)
sudo ufw deny 3000/tcp  # PostgREST (behind proxy)
```

### Performance Tuning

**PostgreSQL:**

Edit `/etc/postgresql/18/main/postgresql.conf`:
```ini
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
```

**Yaci Indexer:**

Adjust concurrency based on network speed:
```bash
# Slow network
--max-concurrency 50

# Fast network
--max-concurrency 200
```

### Monitoring

**Check service status:**
```bash
# Docker
docker compose ps
docker compose logs <service>

# Native
sudo systemctl status yaci
sudo systemctl status postgrest
sudo systemctl status nginx
```

**Prometheus metrics** (available at `:2112/metrics`):
- `yaci_blocks_indexed_total`
- `yaci_transactions_indexed_total`
- `yaci_indexing_errors_total`

**Database health:**
```bash
# Connection to PostgreSQL
psql -U yaci_user -d yaci

# Check data
SELECT COUNT(*) FROM api.blocks_raw;
SELECT COUNT(*) FROM api.transactions_main;

# Database size
SELECT pg_size_pretty(pg_database_size('yaci'));
```

### Backup & Recovery

**Backup database:**
```bash
# Docker
docker exec yaci-explorer-postgres pg_dump -U postgres yaci > backup_$(date +%Y%m%d).sql

# Native
pg_dump -U yaci_user yaci > backup_$(date +%Y%m%d).sql
```

**Restore database:**
```bash
# Docker
cat backup_20250115.sql | docker exec -i yaci-explorer-postgres psql -U postgres yaci

# Native
psql -U yaci_user yaci < backup_20250115.sql
```

**Automated backups (cron):**
```bash
# Add to crontab
0 2 * * * /usr/local/bin/backup-yaci.sh
```

Create `/usr/local/bin/backup-yaci.sh`:
```bash
#!/bin/bash
BACKUP_DIR=/var/backups/yaci
DATE=$(date +%Y%m%d)
pg_dump -U yaci_user yaci | gzip > $BACKUP_DIR/yaci_$DATE.sql.gz
# Keep last 7 days
find $BACKUP_DIR -name "yaci_*.sql.gz" -mtime +7 -delete
```

---

## Troubleshooting

### Explorer Shows No Data

**Check indexer is running:**
```bash
# Docker
docker compose logs yaci

# Native
sudo systemctl status yaci
journalctl -u yaci -f
```

**Verify database has data:**
```bash
psql -U postgres yaci  # or yaci_user for native
SELECT COUNT(*) FROM api.blocks_raw;
```

### Connection Issues

**Test gRPC endpoint:**
```bash
grpcurl -plaintext <grpc-host>:9090 list
```

**Check PostgREST:**
```bash
curl http://localhost:3000/blocks_raw?limit=1
```

### High Memory Usage

**PostgreSQL using too much RAM:**
```bash
# Reduce shared_buffers in postgresql.conf
shared_buffers = 512MB
```

**Yaci indexer using too much memory:**
```bash
# Reduce concurrency
--max-concurrency 50
```

### Indexer Falling Behind

**Check network latency:**
```bash
ping <grpc-host>
```

**Increase concurrency:**
```bash
--max-concurrency 200
```

**Check for errors:**
```bash
# Docker
docker compose logs yaci | grep ERROR

# Native
journalctl -u yaci | grep ERROR
```

---

## Updates & Maintenance

### Update Yaci Indexer

**Docker:**
```bash
docker compose pull yaci
docker compose up -d yaci
```

**Native:**
```bash
cd yaci
git pull
go build -o yaci cmd/yaci/main.go
sudo systemctl restart yaci
```

### Update Explorer UI

**Docker:**
```bash
cd yaci-explorer
git pull
docker compose up -d --build explorer
```

**Native:**
```bash
cd yaci-explorer
git pull
yarn install --production=false
yarn build
sudo systemctl restart nginx  # or your web server
```

### Update PostgreSQL

Follow PostgreSQL upgrade documentation for version migrations.

---

## Architecture Overview

```
┌─────────────────────────┐
│   Cosmos SDK Chain      │
│   (gRPC :9090)          │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   Yaci Indexer          │
│   (Go binary)           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   PostgreSQL 18         │
│   (api schema)          │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   PostgREST             │
│   (REST API :3000)      │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   Explorer UI           │
│   (React SPA :3001)     │
└─────────────────────────┘
```

---

## Support

- **Yaci Indexer**: https://github.com/Cordtus/yaci/issues
- **Explorer**: https://github.com/Cordtus/yaci-explorer/issues

---

## Quick Reference

### Docker Commands
```bash
# Start
docker compose -f docker/docker-compose.yml up -d

# Stop
docker compose -f docker/docker-compose.yml down

# Logs
docker compose -f docker/docker-compose.yml logs -f <service>

# Restart service
docker compose -f docker/docker-compose.yml restart <service>
```

### Native Service Commands
```bash
# Status
sudo systemctl status yaci postgrest nginx

# Restart
sudo systemctl restart yaci postgrest nginx

# Logs
journalctl -u yaci -f
journalctl -u postgrest -f
```

### Database Commands
```bash
# Connect
psql -U yaci_user yaci

# Check data
SELECT COUNT(*) FROM api.blocks_raw;
SELECT COUNT(*) FROM api.transactions_main;

# Backup
pg_dump -U yaci_user yaci > backup.sql
```
