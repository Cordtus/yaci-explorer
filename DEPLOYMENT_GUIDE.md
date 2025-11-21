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
2) Edit `.env` (minimum):
```bash
CHAIN_GRPC_ENDPOINT=your-chain.example.com:9090
POSTGRES_PASSWORD=your_secure_password
```
3) Launch:
```bash
docker compose -f docker/docker-compose.yml up -d
```
Access: http://localhost:3001
4) Monitor:
```bash
docker compose -f docker/docker-compose.yml logs -f yaci
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci -c \
  "SELECT MAX(id) FROM api.blocks_raw;"
```

---

## Architecture
Chain (gRPC) → Yaci indexer → PostgreSQL → PostgREST → Explorer UI.
PostgREST exposes endpoints automatically from the DB schema.

---

## Configuration

### Core env vars
Required for the default `docker-compose` stack:
| Var | Purpose | Example |
| --- | --- | --- |
| `CHAIN_GRPC_ENDPOINT` | Chain gRPC endpoint (gRPC, no `http://`) | `chain.example.com:9090` |
| `POSTGRES_PASSWORD` | Postgres password for the local DB | `changeme` |

Useful options:
| Var | Default | Notes |
| --- | --- | --- |
| `CHAIN_ID` / `CHAIN_NAME` | auto | Override chain metadata shown in the UI |
| `VITE_CHAIN_REST_ENDPOINT` | unset | REST endpoint for IBC/denom resolution |
| `YACI_MAX_CONCURRENCY` | 100 | Raise/lower for sync speed vs load |
| `YACI_LOG_LEVEL` | info | Use `debug` for troubleshooting the indexer |
| `YACI_INSECURE` | `-k` | Remove if gRPC uses TLS |
| Ports: `EXPLORER_PORT` 3001, `POSTGREST_PORT` 3000, `POSTGRES_PORT` 5432, `YACI_METRICS_PORT` 2112 | Adjust to avoid clashes |

### Frontend options
- `src/config/chains.ts`: add a chain entry for custom symbol/feature flags (auto-detection works without it).
- `src/components/layout/header.tsx`: update branding/logo/navigation if you fork the UI.

### Indexer flags (advanced)

The `yaci` container is wired via `docker/docker-compose.yml`. Common flags:
- `--live` – enabled by default; continue indexing as new blocks arrive.
- `--start` / `--stop` – optional bounded range when running the standalone binary.
- `--max-concurrency N` – from `YACI_MAX_CONCURRENCY`.
- `-k` – skip TLS verification (controlled via `YACI_INSECURE`).
- `-l debug` – more verbose logs for troubleshooting.

---

## Switching Chains
- Fresh start (recommended):
```bash
docker compose -f docker/docker-compose.yml down -v
# update CHAIN_GRPC_ENDPOINT in .env
docker compose -f docker/docker-compose.yml up -d
```
- Clear DB, keep container:
```bash
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d postgres
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci -c \
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
By default the indexer:
- Backfills from the first missing block in the DB up to the current tip.
- Continues in `--live` mode as new blocks are produced.

To run a bounded range with the standalone binary, add:
```bash
yaci extract postgres <grpc-endpoint> -p <dsn> --start 1000000 --stop 2000000
```
With `--live`, the indexer continues past `--stop` once the initial range is filled.

### Local Yaci build
```bash
git clone https://github.com/manifest-network/yaci.git
cd yaci && docker build -t yaci:local -f docker/Dockerfile .
cd ../yaci-explorer && echo "YACI_IMAGE=yaci:local" >> .env
docker compose -f docker/docker-compose.yml up -d
```

---

## Fly.io Deployment (indexer + explorer)

You can run the same stack on Fly.io by splitting services into separate apps.

### 1) Postgres + PostgREST on Fly
- Create a Fly Postgres cluster (`fly pg create`) or use an existing one (e.g. `republic-yaci-pg`).
- Get the internal DSN:
  ```bash
  fly pg connection -a republic-yaci-pg
  ```
- For PostgREST, set (example):
  ```bash
  PGRST_DB_URI=postgres://postgres:<PASSWORD>@republic-yaci-pg.flycast:5432/postgres?sslmode=disable
  PGRST_DB_SCHEMA=api
  PGRST_DB_ANON_ROLE=postgres
  ```
  Make sure the URI includes a database name (e.g. `/postgres` or `/yaci`) and `sslmode=disable` for `*.flycast`.

### 2) Yaci indexer app on Fly
- Deploy the `yaci` image (from `manifest-network/yaci` or your fork) using the Dockerfile in that repo.
- Configure secrets (example for Republic):
  ```bash
  fly secrets set \
    YACI_GRPC_ENDPOINT="rpc.republicai.io:9090" \
    YACI_POSTGRES_DSN="postgres://postgres:<PASSWORD>@republic-yaci-pg.flycast:5432/postgres?sslmode=disable" \
    -a your-yaci-app
  ```
- `YACI_GRPC_ENDPOINT` must be `host:port` with no `http://`, and must point to a gRPC endpoint (not REST). For `rpc.republicai.io:9090`, TLS is enabled even on the non-standard port.
- `YACI_POSTGRES_DSN` should be copied from `fly pg connection` and adjusted as above.
- The entrypoint typically runs `yaci extract postgres ... --live`, which:
  - Backfills from the first missing height up to the current chain tip.
  - Continues live as new blocks arrive.
- Advanced knobs (set via Fly secrets if needed):
  - `YACI_START` / `YACI_STOP` → `--start` / `--stop` block heights.
  - `YACI_REINDEX=true` → `--reindex` (force a full reprocess; only safe if the node still has older blocks).
- Run **only one** indexer against a given DB; multiple indexers on the same DB can cause conflicts (for example, “start block is greater than stop block” when two processes race on the same range).
- To reset indexing on Fly, connect and truncate:
  ```bash
  fly pg connect -a republic-yaci-pg
  TRUNCATE api.blocks_raw, api.transactions_raw, api.transactions_main,
           api.messages_raw, api.messages_main, api.events_raw, api.events_main
           RESTART IDENTITY;
  ```

### 3) Explorer app on Fly
- Build the explorer as usual (`npm run build`) and deploy the static app (or use the provided Dockerfile).
- Set frontend env in `.env` / Fly:
  ```bash
  VITE_POSTGREST_URL=https://<postgrest-app>.fly.dev        # or https://your-domain/api via proxy
  CHAIN_GRPC_ENDPOINT=rpc.republicai.io:9090                # same gRPC host:port as the indexer
  CHAIN_RPC_ENDPOINT=http://your-rpc-host:26657             # optional, for RPC/REST features
  ```
- Point `VITE_CHAIN_REST_ENDPOINT` to a public REST endpoint for IBC/denom metadata as in the local guide.

---

## Production Tips
### Minimal `.env`
```bash
CHAIN_GRPC_ENDPOINT=your-chain.example.com:9090
VITE_CHAIN_REST_ENDPOINT=https://rest.yourchain.com
POSTGRES_PASSWORD=strong_password
VITE_POSTGREST_URL=/api
YACI_MAX_CONCURRENCY=100
YACI_LOG_LEVEL=info
YACI_IMAGE=ghcr.io/cordtus/yaci:v1.0.0
```

### Reverse proxy (nginx)
```nginx
location / { proxy_pass http://localhost:3001; proxy_set_header Host $host; }
location /api/ { proxy_pass http://localhost:3000/; proxy_set_header Host $host; }
```

### Backups (daily)
```bash
docker exec yaci-explorer-postgres pg_dump -U postgres -d yaci -F c -f /tmp/backup.dump
docker cp yaci-explorer-postgres:/tmp/backup.dump /backups/backup_$(date +%Y%m%d_%H%M%S).dump
find /backups -name "backup_*.dump" -mtime +7 -delete
```

### Security checklist
- Change `POSTGRES_PASSWORD`
- Remove `YACI_INSECURE=-k` if TLS works
- HTTPS proxy, firewall DB port
- Use `/api` proxy for PostgREST
- Pin `YACI_IMAGE`
- Add log rotation and backups

### Sizing (rough)
- Small/test: 2 vCPU, 4GB RAM, 50GB, `YACI_MAX_CONCURRENCY=50`
- Medium: 4 vCPU, 8GB RAM, 200GB, `YACI_MAX_CONCURRENCY=100`
- Large: 8 vCPU, 16GB RAM, 500GB+, `YACI_MAX_CONCURRENCY=200`
Storage: ~1–5GB per million blocks (varies by tx volume).

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
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci -c \
  "SELECT MAX(id) FROM api.blocks_raw;"
```

---

## Schema (PostgREST)
- `blocks_raw`: `id`, `data`
- `transactions_main`: `id`, `height`, `timestamp`, `fee`, `gas_used`, `error`
- `messages_main`: `id`, `message_index`, `type`, `sender`, `mentions`, `metadata`
- `events_main`: `id`, `event_index`, `event_type`, `attr_key`, `attr_value`

These tables can live in any PostgreSQL instance (local Docker, Fly Postgres, managed cloud DB); as long as the Yaci indexer writes to this schema and PostgREST exposes it, the explorer remains unchanged.

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
