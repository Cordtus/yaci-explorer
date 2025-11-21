# Yaci Block Explorer

Explorer UI for Cosmos SDK chains (with EVM support) backed by the [Yaci indexer](https://github.com/manifest-network/yaci).

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
# Edit .env: set CHAIN_GRPC_ENDPOINT and POSTGRES_PASSWORD
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
yarn install
yarn dev                    # Start dev server on :5173
yarn build                  # Production build
yarn typecheck              # Type check
yarn lint                   # Lint code
```

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

The explorer uses PostgREST to query the PostgreSQL database populated by Yaci:

```bash
# Recent blocks
curl "http://localhost:3000/blocks_raw?order=id.desc&limit=10"

# Transaction by hash
curl "http://localhost:3000/transactions_main?id=eq.HASH"

# Messages for address
curl "http://localhost:3000/messages_main?mentions=cs.{ADDRESS}"
```

## License

MIT
