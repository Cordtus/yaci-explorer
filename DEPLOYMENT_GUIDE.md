# Yaci Explorer Deployment Guide

Complete guide for deploying the Yaci Block Explorer to any Cosmos SDK chain.

---

## Quick Setup

Get the explorer running on your chain in under 5 minutes.

### 1. Clone and Configure

```bash
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer
cp .env.example .env
```

### 2. Edit `.env` - Change These Two Lines

```bash
# Your chain's gRPC endpoint (REQUIRED)
CHAIN_GRPC_ENDPOINT=your-chain.example.com:9090

# Database password (REQUIRED - change from default!)
POSTGRES_PASSWORD=your_secure_password_here
```

That's it. Everything else auto-detects.

### 3. Deploy

```bash
docker compose -f docker/docker-compose.yml up -d
```

**Access the explorer**: http://localhost:3001

The explorer will:
- Auto-detect chain ID and name from blocks
- Start indexing from genesis
- Continue indexing in real-time
- Display all data immediately as it's indexed

### 4. Monitor Progress

```bash
# Watch indexer logs
docker compose -f docker/docker-compose.yml logs -f yaci

# Check latest indexed block
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci -c \
  "SELECT MAX(id) as latest_block FROM api.blocks_raw;"
```

---

## Architecture Overview

Four components work together:

```
Chain (gRPC :9090)
    ↓
Yaci Indexer (reads blocks, parses data)
    ↓
PostgreSQL (stores indexed data)
    ↓
PostgREST (auto-generates REST API)
    ↓
Explorer Frontend (queries API, displays UI)
```

**Data Flow:**
- **Indexing**: Chain → Yaci → PostgreSQL (continuous background process)
- **Viewing**: User → Frontend → PostgREST → PostgreSQL (on-demand queries)

**No configuration needed for PostgREST** - it automatically generates REST endpoints from PostgreSQL schema.

---

## Configuration Details

### Environment Variables Reference

#### Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `CHAIN_GRPC_ENDPOINT` | Chain gRPC endpoint for indexing | `chain.example.com:9090` or `host.docker.internal:9090` (local) |
| `POSTGRES_PASSWORD` | Database password | Change from `foobar` default |

#### Optional (with smart defaults)

| Variable | Default | When to Change |
|----------|---------|----------------|
| `CHAIN_ID` | Auto-detected | Override if detection fails |
| `CHAIN_NAME` | Auto-detected | Override for custom branding |
| `VITE_CHAIN_REST_ENDPOINT` | Not set | Enable IBC denom resolution (see Optional Features) |
| `YACI_MAX_CONCURRENCY` | `100` | Increase for faster sync, decrease if chain can't handle load |
| `YACI_LOG_LEVEL` | `info` | Use `debug` when diagnosing issues |
| `YACI_INSECURE` | `-k` | Remove for chains with TLS on gRPC |

#### Service Ports (change if conflicts)

| Variable | Default | Service |
|----------|---------|---------|
| `EXPLORER_PORT` | `3001` | Web UI |
| `POSTGREST_PORT` | `3000` | API server |
| `POSTGRES_PORT` | `5432` | Database |
| `YACI_METRICS_PORT` | `2112` | Prometheus metrics |

### Frontend Configuration Files

#### Add Chain-Specific Settings (Optional)

File: `src/config/chains.ts`

Add your chain for better token display:

```typescript
export const chains: Record<string, ChainConfig> = {
  'your-chain-1': {
    name: 'Your Chain Network',
    nativeDenom: 'utoken',
    nativeSymbol: 'TOKEN',
    decimals: 6,
    features: {
      evm: false,    // Has EVM module?
      ibc: true,     // Has IBC?
      wasm: true,    // Has CosmWasm?
    },
  },
}
```

**Not required** - the explorer auto-detects denoms with `u` or `a` prefixes. Only add if you need custom token mappings or feature flags.

#### Customize Branding (Optional)

File: `src/components/layout/header.tsx` (line ~30-40)

```typescript
// Default: uses CHAIN_NAME env var
<div className="text-xl font-bold">
  {chainName || 'Blockchain'} Explorer
</div>

// Custom branding:
<div className="text-xl font-bold">
  Your Custom Brand
</div>

// Or add logo:
<img src="/logo.png" alt="Your Chain" className="h-8" />
<span>Your Chain Explorer</span>
```

### Yaci Indexer Configuration

Configured via command-line flags in `docker/docker-compose.yml` under the `yaci` service.

**Useful flags:**

| Flag | Purpose | Example |
|------|---------|---------|
| `--live` | Continue indexing new blocks (always use) | Enabled by default |
| `--start-height N` | Start from specific block | `--start-height 1000000` |
| `--end-height N` | Stop at specific block | `--end-height 2000000` |
| `--max-concurrency N` | Concurrent workers | `--max-concurrency 200` |
| `-k` | Skip TLS verification | For non-TLS chains |
| `-l LEVEL` | Log level | `-l debug` |

**To modify**, edit `docker/docker-compose.yml`:

```yaml
yaci:
  command: >
    extract postgres ${CHAIN_GRPC_ENDPOINT}
    -p postgres://user:pass@postgres:5432/yaci
    --live
    --start-height 1000000              # Add this
    --max-concurrency 200               # Change this
```

---

## Switching to a Different Chain

### Option A: Fresh Start (Recommended)

Wipes all data, indexes new chain from genesis.

```bash
# Stop and remove everything
docker compose -f docker/docker-compose.yml down -v

# Edit .env with new chain endpoint
nano .env
# Change: CHAIN_GRPC_ENDPOINT

# Optional: update src/config/chains.ts if new chain

# Start services
docker compose -f docker/docker-compose.yml up -d
```

### Option B: Clear Database, Keep Container

Preserves database container but clears data.

```bash
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d postgres

# Clear tables
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci -c \
  "TRUNCATE api.blocks_raw, api.transactions_main, api.messages_main, api.events_main;"

# Edit .env for new chain
nano .env

# Restart all services
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d
```

### Option C: Run Multiple Chains Simultaneously

Deploy separate instances with different ports.

```bash
# Chain A (default ports)
cd yaci-explorer-chain-a
docker compose -f docker/docker-compose.yml up -d

# Chain B (different ports to avoid conflicts)
cd yaci-explorer-chain-b
# Edit .env:
CHAIN_GRPC_ENDPOINT=chain-b.example.com:9090
POSTGRES_PORT=5433
POSTGREST_PORT=3002
EXPLORER_PORT=3003
YACI_METRICS_PORT=2113

docker compose -f docker/docker-compose.yml up -d
```

**Access:**
- Chain A: http://localhost:3001
- Chain B: http://localhost:3003

---

## Optional Features

### IBC Denom Resolution

**What**: Resolves `ibc/HASH` tokens to readable names (e.g., `ibc/ABC123...` → `ATOM`)

**Requires**: Chain REST API accessible from user browsers

**Enable:**

```bash
# In .env
VITE_CHAIN_REST_ENDPOINT=https://your-chain.example.com:1317
```

**How it works:**
1. Frontend detects `ibc/HASH` denom
2. Queries chain's `/ibc/apps/transfer/v1/denom_traces/{hash}` endpoint
3. Caches result in browser localStorage for 24h

**Without**: IBC denoms show as truncated hashes
**With**: IBC denoms show as readable symbols

### EVM Transaction Support

**What**: Displays EVM transaction data for chains with EVM module (Evmos, Mantra, etc.)

**Enable in** `src/config/chains.ts`:

```typescript
features: {
  evm: true,
}
```

Shows Ethereum-style hashes, addresses, and EVM-specific events.

### Prometheus Metrics

**Enabled by default** on port 2112.

**Access:**
```bash
curl http://localhost:2112/metrics
```

**Metrics include:**
- Indexer sync status
- Blocks processed per second
- Database write latency
- gRPC connection health

**Prometheus scraper config:**
```yaml
scrape_configs:
  - job_name: 'yaci-indexer'
    static_configs:
      - targets: ['localhost:2112']
```

### Historical Block Range Indexing

**What**: Index only specific block range instead of full history

**Edit** `docker/docker-compose.yml`:

```yaml
yaci:
  command: >
    extract postgres ${CHAIN_GRPC_ENDPOINT}
    --start-height 1000000
    --end-height 2000000
    --max-concurrency 200
```

**Without `--live`**: Indexer stops at `--end-height`
**With `--live`**: Indexer continues after `--end-height`

### Local Yaci Development Build

**When**: Contributing to Yaci or testing custom patches

```bash
# Clone and build Yaci
git clone https://github.com/manifest-network/yaci.git
cd yaci
docker build -t yaci:local -f docker/Dockerfile .

# Configure explorer
cd ../yaci-explorer
echo "YACI_IMAGE=yaci:local" >> .env

# Deploy
docker compose -f docker/docker-compose.yml up -d
```

---

## Production Deployment

### Minimal Production `.env`

```bash
# Chain
CHAIN_GRPC_ENDPOINT=your-chain.example.com:9090
VITE_CHAIN_REST_ENDPOINT=https://rest.yourchain.com

# Security
POSTGRES_PASSWORD=use_strong_random_password
YACI_INSECURE=  # Empty = use TLS

# API - use reverse proxy
VITE_POSTGREST_URL=/api

# Performance
YACI_MAX_CONCURRENCY=100
YACI_LOG_LEVEL=info

# Pin Yaci version
YACI_IMAGE=ghcr.io/cordtus/yaci:v1.0.0
```

### Reverse Proxy Setup (nginx)

Required for HTTPS and clean URLs.

```nginx
server {
    listen 443 ssl http2;
    server_name explorer.yourchain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
    }
}
```

With this setup, `VITE_POSTGREST_URL=/api` works on any domain.

### Database Backups

**Automated daily backup script:**

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/yaci-explorer"
DATE=$(date +%Y%m%d_%H%M%S)

docker exec yaci-explorer-postgres pg_dump \
  -U postgres -d yaci -F c \
  -f /tmp/backup_${DATE}.dump

docker cp yaci-explorer-postgres:/tmp/backup_${DATE}.dump \
  ${BACKUP_DIR}/backup_${DATE}.dump

# Keep last 7 days
find ${BACKUP_DIR} -name "backup_*.dump" -mtime +7 -delete
```

**Add to crontab:**
```bash
0 2 * * * /path/to/backup.sh
```

**Restore:**
```bash
cat backup.dump | docker exec -i yaci-explorer-postgres \
  pg_restore -U postgres -d yaci
```

### Security Checklist

- [ ] Change `POSTGRES_PASSWORD` from default
- [ ] Remove `YACI_INSECURE=-k` if chain has TLS
- [ ] Set up reverse proxy with HTTPS
- [ ] Restrict PostgreSQL port (5432) via firewall
- [ ] Use `VITE_POSTGREST_URL=/api` with reverse proxy
- [ ] Pin `YACI_IMAGE` to specific version (not `main`)
- [ ] Configure log rotation
- [ ] Set up database backups

### Resource Scaling

**Minimal (testnet):**
- 2 CPU cores
- 4GB RAM
- 50GB storage
- `YACI_MAX_CONCURRENCY=50`

**Medium (small mainnet):**
- 4 CPU cores
- 8GB RAM
- 200GB storage
- `YACI_MAX_CONCURRENCY=100`

**Large (high activity mainnet):**
- 8 CPU cores
- 16GB RAM
- 500GB+ storage
- `YACI_MAX_CONCURRENCY=200`

**Storage growth**: ~1-5GB per million blocks (varies by tx volume)

### Monitoring with Prometheus

**Alert rules example:**

```yaml
groups:
  - name: yaci_alerts
    rules:
      - alert: IndexerBehind
        expr: (yaci_chain_height - yaci_indexer_sync_height) > 100
        for: 5m

      - alert: IndexerDown
        expr: up{job="yaci-indexer"} == 0
        for: 2m
```

**Key metrics to watch:**
- `yaci_blocks_indexed_total` - Total blocks processed
- `yaci_indexer_sync_height` - Current indexer height
- `yaci_db_write_duration_seconds` - Database performance

---

## Common Operations

### View Logs

```bash
# All services
docker compose -f docker/docker-compose.yml logs -f

# Specific service
docker compose -f docker/docker-compose.yml logs -f yaci
```

### Check Service Status

```bash
docker compose -f docker/docker-compose.yml ps
```

### Restart Services

```bash
# Restart all
docker compose -f docker/docker-compose.yml restart

# Restart specific service
docker compose -f docker/docker-compose.yml restart yaci
```

### Update Yaci Image

```bash
docker compose -f docker/docker-compose.yml pull yaci
docker compose -f docker/docker-compose.yml up -d yaci
```

### Rebuild Explorer After Code Changes

```bash
docker compose -f docker/docker-compose.yml up -d --build explorer
```

### Check Indexing Progress

```bash
# Latest indexed block
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci -c \
  "SELECT MAX(id) as latest_block FROM api.blocks_raw;"

# Row counts
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci -c \
  "SELECT 'blocks' as table, COUNT(*) FROM api.blocks_raw
   UNION ALL SELECT 'txs', COUNT(*) FROM api.transactions_main;"
```

### Database Operations

```bash
# Connect to database
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci

# Check database size
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci -c \
  "SELECT pg_size_pretty(pg_database_size('yaci'));"
```

---

## Database Schema Reference

Yaci creates these tables in the `api` schema:

**blocks_raw**: Raw block data
- `id` (bigint): Block height
- `data` (jsonb): Full block structure

**transactions_main**: Parsed transactions
- `id` (text): Transaction hash
- `height` (bigint): Block height
- `timestamp` (timestamp): Transaction time
- `fee` (jsonb): Fee structure
- `gas_used` (bigint): Gas consumed
- `error` (text): Error if failed

**messages_main**: Transaction messages
- `id` (text): Transaction hash
- `message_index` (int): Message index
- `type` (text): Message type
- `sender` (text): Sender address
- `mentions` (text[]): All addresses in message
- `metadata` (jsonb): Full message data

**events_main**: Transaction events
- `id` (text): Transaction hash
- `event_index` (int): Event index
- `event_type` (text): Event type
- `attr_key` (text): Attribute key
- `attr_value` (text): Attribute value

PostgREST automatically exposes these as REST endpoints.

---

## Service URLs

Default ports (configurable via `.env`):

- **Explorer UI**: http://localhost:3001
- **PostgREST API**: http://localhost:3000
- **Prometheus Metrics**: http://localhost:2112
- **PostgreSQL**: localhost:5432

---

## Getting Help

**Yaci Indexer Issues**: https://github.com/manifest-network/yaci/issues
**Explorer Frontend Issues**: https://github.com/Cordtus/yaci-explorer/issues
**PostgREST Documentation**: https://postgrest.org/
