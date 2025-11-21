# Yaci Explorer Deployment Guide

Deploy the explorer on any Cosmos SDK chain.

---

## Quick Setup
1) Clone and copy env:
```bash
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer
cp .env.example .env
```
2) Configure `.env` (minimum):
```bash
yarn configure:env   # prompts for Postgres username/password/database and sets SKIP_ENV_PROMPTS=true
CHAIN_GRPC_ENDPOINT=your-chain.example.com:9090
```
3) Launch:
```bash
docker compose -f docker/docker-compose.yml up -d
```
Access: http://localhost:3001
4) Monitor:
```bash
docker compose -f docker/docker-compose.yml logs -f yaci
docker exec -it yaci-explorer-postgres psql -U yaci -d yaci -c \
  "SELECT MAX(id) FROM api.blocks_raw;"
```

---

## Architecture

```
Chain (gRPC) -> Yaci Indexer -> PostgreSQL -> PostgREST -> Explorer UI
```

The explorer uses the `@yaci/database-client` package for all PostgREST API interactions.

## Deployment Options

### 1. Docker Compose (Recommended)

Everything runs in containers. Best for quick setup and cloud deployments.

```bash
./scripts/setup.sh
# Select option 1
```

Or manually:
```bash
cp .env.example .env
# Edit .env with your settings
docker compose -f docker/docker-compose.yml up -d
```

### 2. Native (Systemd)

Installs services directly on the host. Best for VPS deployments.

```bash
sudo ./scripts/setup.sh
# Select option 2
```

This installs and configures:
- PostgreSQL
- PostgREST
- Yaci indexer
- Node.js frontend server

### 3. Frontend Only

Connect to an existing PostgREST instance.

```bash
./scripts/setup.sh
# Select option 3
```

## Fly.io Deployment

### 1. Create Postgres Cluster
```bash
fly postgres create --name yaci-pg
```

### 2. Deploy Yaci Indexer
```bash
cd /path/to/yaci
fly launch --name yaci-indexer
fly secrets set YACI_POSTGRES_DSN="postgres://..." YACI_GRPC_ENDPOINT="..."
```

### 3. Deploy Explorer
```bash
fly launch --name yaci-explorer
# Set VITE_POSTGREST_URL to your PostgREST endpoint
```

## Reverse Proxy (Production)

For production, put a reverse proxy in front:

**Caddy:**
```
yourdomain.com {
    reverse_proxy /api/* localhost:3000 {
        header_up -/api
    }
    reverse_proxy localhost:3001
}
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://localhost:3000/;
    }

    location / {
        proxy_pass http://localhost:3001;
    }
}
```

## Database Reset

To completely reset and re-index:

**Docker:**
```bash
docker compose -f docker/docker-compose.yml down -v
# update CHAIN_GRPC_ENDPOINT in .env
docker compose -f docker/docker-compose.yml up -d
```
- Clear DB, keep container:
```bash
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d postgres
docker exec -it yaci-explorer-postgres psql -U yaci -d yaci -c \
  "TRUNCATE api.blocks_raw, api.transactions_main, api.messages_main, api.events_main;"
docker compose -f docker/docker-compose.yml up -d
```
- Multiple chains: run separate folders/ports (`POSTGRES_PORT`, `POSTGREST_PORT`, `EXPLORER_PORT`, `YACI_METRICS_PORT`).

---

## Optional Features
### IBC denom resolution
```
VITE_CHAIN_REST_ENDPOINT=https://your-chain.example.com:1317
```
Browser queries `/ibc/apps/transfer/v1/denom_traces/{hash}` and caches for 24h.

### EVM transactions
Enable per-chain in `src/config/chains.ts`:
```ts
features: { evm: true }
```

### Prometheus metrics (default :2112)
`curl http://localhost:2112/metrics`
Scrape example:
```yaml
scrape_configs:
  - job_name: yaci-indexer
    static_configs: [{ targets: ['localhost:2112'] }]
```

### Historical range
Add to `yaci` command:
```yaml
--start-height 1000000
--end-height 2000000
```
`--live` continues past `--end-height`; omit to stop.

### Local Yaci build
```bash
git clone https://github.com/manifest-network/yaci.git
cd yaci && docker build -t yaci:local -f docker/Dockerfile .
cd ../yaci-explorer && echo "YACI_IMAGE=yaci:local" >> .env
```

**Native:**
```bash
sudo -u postgres dropdb yaci
sudo -u postgres createdb yaci
sudo systemctl restart yaci
```

## Monitoring

- **Prometheus metrics:** http://localhost:2112/metrics
- **Check indexer logs:**
  - Docker: `docker logs yaci-indexer -f`
  - Native: `journalctl -u yaci -f`

## Troubleshooting

### "Failed to connect to gRPC"
- Verify `CHAIN_GRPC_ENDPOINT` is correct
- Check if the chain node is running and accessible
- For local chains in Docker, use `host.docker.internal:9090`

### "Connection refused" to PostgREST
- Wait for PostgreSQL to be healthy
- Check that migrations completed (Yaci creates the `api` schema)

### Explorer shows no data
- Verify Yaci is indexing: check logs for "Extracting blocks"
- Check PostgREST is running: `curl http://localhost:3000/blocks_raw?limit=1`

## Advanced Configuration

### Multiple Chains

Run separate stacks with different ports in separate directories.

### Custom Yaci Build

```bash
docker exec yaci-explorer-postgres pg_dump -U yaci -d yaci -F c -f /tmp/backup.dump
docker cp yaci-explorer-postgres:/tmp/backup.dump /backups/backup_$(date +%Y%m%d_%H%M%S).dump
find /backups -name "backup_*.dump" -mtime +7 -delete
```

### IBC Denomination Resolution

Set `VITE_CHAIN_REST_ENDPOINT` in .env to your chain's REST API for automatic IBC denom resolution.

### Sizing (rough)
- Small/test: 2 vCPU, 4GB RAM, 50GB, `YACI_MAX_CONCURRENCY=50`
- Medium: 4 vCPU, 8GB RAM, 200GB, `YACI_MAX_CONCURRENCY=100`
- Large: 8 vCPU, 16GB RAM, 500GB+, `YACI_MAX_CONCURRENCY=200`
Storage: ~1-5GB per million blocks (varies by tx volume).

### Prometheus alerts (example)
```yaml
alerts:
  - alert: IndexerBehind
    expr: (yaci_chain_height - yaci_indexer_sync_height) > 100
    for: 5m
  - alert: IndexerDown
    expr: up{job="yaci-indexer"} == 0
    for: 2m
```

---

## Common Ops
```bash
# Logs
docker compose -f docker/docker-compose.yml logs -f

# Status
docker compose -f docker/docker-compose.yml ps

# Restart
docker compose -f docker/docker-compose.yml restart

# Update Yaci image
docker compose -f docker/docker-compose.yml pull yaci && docker compose -f docker/docker-compose.yml up -d yaci

# Rebuild explorer
docker compose -f docker/docker-compose.yml up -d --build explorer

# Indexing progress
docker exec -it yaci-explorer-postgres psql -U yaci -d yaci -c \
  "SELECT MAX(id) FROM api.blocks_raw;"
```

---

## Resetting after a devnet/genesis restart
Devnets often restart from height 1. When block numbers repeat, the indexer hits unique constraints and stalls, and the UI may show stale chain metadata. Reset the DB before re-indexing:

### Docker (recommended)
Use the helper script (stops services, wipes `postgres-data`, restarts):
```bash
./scripts/reset-devnet.sh
# custom compose file:
./scripts/reset-devnet.sh --compose-file path/to/compose.yml
# non-interactive:
SKIP_CONFIRM=1 ./scripts/reset-devnet.sh
```

### Manual Postgres reset
1) Stop Yaci + PostgREST.
2) Truncate tables (or drop the DB):
```sql
TRUNCATE api.blocks_raw, api.transactions_main, api.transactions_raw, api.messages_main, api.events_main RESTART IDENTITY CASCADE;
```
3) Restart Yaci with `--live` so it re-ingests from height 1.
4) Refresh the UI (or use the reset banner) to clear cached chain info.

### Bare-metal helper
If you're not using docker-compose, run:
```bash
yarn reset:full
```
The script sources `.env`, ensures `psql`/`jq` are available, points the guard at your local Postgres host, and executes `scripts/chain-reset-guard.sh`. Restart the indexer afterward.

Need a one-liner that also rebuilds and restarts services? Use:
```bash
yarn redeploy:systemd   # set FORCE_ENV_PROMPTS=true to re-run the credential helper
```
Override service names with `YACI_INDEXER_SERVICE`, `POSTGREST_SERVICE`, and `YACI_EXPLORER_SERVICE` when calling it.
This helper now invokes `scripts/update-yaci.sh` first, which clones/pulls `cordtus/yaci` (or whatever `YACI_REPO_URL`/`YACI_BRANCH` point to) and runs `YACI_BUILD_CMD` (default `make build`). Set `YACI_SOURCE_DIR` to the directory that your `yaci-indexer` systemd unit uses so the rebuilt binary is picked up on restart, or export `YACI_SKIP_UPDATE=true` to leave the running binary untouched.
Both flows auto-create the configured `POSTGRES_DB` when it's missing (bare metal via `scripts/full-reset.sh`, docker/systemd via `scripts/chain-reset-guard.sh`), so feel free to rename the database per-chain without manual SQL. If the credentials can't create databases you'll see a warning; create it once and rerun.

### UI cache note
On restart detection the UI can clear cached chain ID/denoms; a hard refresh also works if you do not see the banner.

### Automatic guard
Set `ENABLE_CHAIN_RESET_GUARD=true` (and `CHAIN_RPC_ENDPOINT` / `RESET_GUARD_*` as needed) to let the docker stack run `scripts/chain-reset-guard.sh` before Yaci starts. The guard compares the stored genesis hash and latest remote height - if it detects a rewind it truncates the main tables automatically (or, if `RESET_GUARD_AUTO_TRUNCATE=false`, it stops with a warning so you can intervene manually).

---

## Schema (PostgREST)
- `blocks_raw`: `id`, `data`
- `transactions_main`: `id`, `height`, `timestamp`, `fee`, `gas_used`, `error`
- `messages_main`: `id`, `message_index`, `type`, `sender`, `mentions`, `metadata`
- `events_main`: `id`, `event_index`, `event_type`, `attr_key`, `attr_value`

---

## Service URLs (defaults)
- Explorer UI: http://localhost:3001
- PostgREST API: http://localhost:3000
- Prometheus: http://localhost:2112
- PostgreSQL: localhost:5432

---

## Help
- Yaci Indexer: https://github.com/manifest-network/yaci/issues
- Explorer: https://github.com/Cordtus/yaci-explorer/issues
- PostgREST: https://postgrest.org/
