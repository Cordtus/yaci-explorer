# Yaci Block Explorer

Explorer UI for Cosmos SDK chains (with EVM support) backed by the [Yaci indexer](https://github.com/Cordtus/yaci).

## Features
- Auto-detects chain ID, denoms, and message types
- Cosmos + EVM transactions, live block updates, unified search
- IBC denom resolution with in-browser caching
- Analytics: chain stats, gas efficiency, volume, message types
- Built with React Router 7, TypeScript, Tailwind/shadcn, TanStack Query

## Quick Start

### Interactive Setup (Recommended)
```bash
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer
./scripts/setup.sh
```

The setup script will guide you through configuration and offer three deployment options:
1. **Docker Compose** - Full stack with one command
2. **Native** - Systemd services on bare metal
3. **Frontend only** - Connect to existing PostgREST

### Manual Docker Setup
```bash
cp .env.example .env
bun run configure:env # prompts once for Postgres credentials; sets SKIP_ENV_PROMPTS=true afterwards
# set CHAIN_GRPC_ENDPOINT in .env (redeploy uses existing creds unless FORCE_ENV_PROMPTS=true)
docker compose -f docker/docker-compose.yml up -d
```

**Services:**
- Explorer UI: http://localhost:3001
- PostgREST API: http://localhost:3000
- Prometheus metrics: http://localhost:2112

## Configuration

Only two variables are required:

| Variable | Description |
|----------|-------------|
| `CHAIN_GRPC_ENDPOINT` | gRPC endpoint of the chain to index |
| `POSTGRES_PASSWORD` | PostgreSQL password |

Optional:
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_POSTGREST_URL` | PostgREST URL for frontend | `/api` |
| `VITE_CHAIN_REST_ENDPOINT` | REST endpoint for IBC resolution | - |
| `YACI_MAX_CONCURRENCY` | Concurrent block processing | `100` |

## Development

```bash
bun install
bun dev                     # Start dev server on :5173
bun run build               # Production build
bun run typecheck           # Type check
bun run lint                # Lint code
```

## Key Env Vars (see `.env.example`)
| Variable | Purpose | Default |
| -- | -- | -- |
| `CHAIN_GRPC_ENDPOINT` | Chain gRPC endpoint | `localhost:9090` |
| `CHAIN_RPC_ENDPOINT` | Tendermint RPC | `http://localhost:26657` |
| `POSTGRES_USER` | Database role used by PostgREST/Yaci | `yaci` |
| `POSTGRES_PASSWORD` | DB password | `changeme` |
| `VITE_POSTGREST_URL` | PostgREST base URL for the UI | `http://localhost:3000` |
| `VITE_CHAIN_REST_ENDPOINT` | REST endpoint for IBC denom traces | unset |
| `CHAIN_ID`, `CHAIN_NAME` | Override auto-detection | auto |
| `YACI_IMAGE` | Yaci image tag | `ghcr.io/cordtus/yaci:main` |

### Frontend config overrides (`VITE_*`)
All UI timing/limit constants can be tuned via env vars (see `.env.example`). Highlights:

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_TX_PAGE_SIZE` | Transactions per page | `20` |
| `VITE_SEARCH_ADDRESS_LIMIT` | Max address results checked | `20` |
| `VITE_ANALYTICS_*` | Lookbacks + refresh intervals for charts/cards | (various) |
| `VITE_QUERY_*` | React Query cache timings | `10s` / `5m` |

Multi-chain: run separate compose stacks with unique `POSTGRES_PORT`, `POSTGREST_PORT`, `EXPLORER_PORT`.

## Project Structure
```
src/
  routes/         # Page components
  components/     # UI components
  lib/            # API client, utilities
  contexts/       # React contexts
packages/
  database-client # PostgREST API client package
docker/
  docker-compose.yml
  explorer/       # Dockerfile & nginx config
scripts/
  setup.sh        # Interactive deployment
```

## API

The explorer uses the `@yaci/database-client` package to query the PostgreSQL database populated by Yaci via PostgREST:

```bash
# Recent blocks
curl "http://localhost:3000/blocks_raw?order=id.desc&limit=10"

# Transaction by hash
curl "http://localhost:3000/transactions_main?id=eq.HASH"

# Messages for address
curl "http://localhost:3000/messages_main?mentions=cs.{ADDRESS}"
```

## Database Reset

**Single method:** `bun run reset:db` (or `./scripts/reset-database.sh`)
- Docker: Stops services, removes postgres volume, restarts
- Bare-metal: Truncates index tables via psql

## License

MIT
