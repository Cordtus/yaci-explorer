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
yarn configure:env # prompts once for Postgres credentials; sets SKIP_ENV_PROMPTS=true afterwards
# set CHAIN_GRPC_ENDPOINT in .env (redeploy uses existing creds unless FORCE_ENV_PROMPTS=true)
docker compose -f docker/docker-compose.yml up -d
```

**Services:**
- Explorer UI: http://localhost:3001
- PostgREST API: http://localhost:3000
- Prometheus metrics: http://localhost:2112

## Configuration

### Backend Configuration (.env)

Only two variables are required:

| Variable | Description |
|----------|-------------|
| `CHAIN_GRPC_ENDPOINT` | gRPC endpoint of the chain to index |
| `POSTGRES_PASSWORD` | PostgreSQL password |

Optional:
| Variable | Description | Default |
|----------|-------------|---------|
| `YACI_MAX_CONCURRENCY` | Concurrent block processing | `100` |

### Frontend Configuration (config.json)

Frontend configuration is provided at runtime via `config.json` (not build-time environment variables).

1. Copy the example configuration:
```bash
cp public/config.json.example public/config.json
```

2. Edit `public/config.json` with your settings:
```json
{
  "apiUrl": "https://your-postgrest-api.com",
  "chainRestEndpoint": "https://your-chain-rest-api.com",
  "evmEnabled": true,
  "ibcEnabled": true,
  "appName": "My Explorer",
  ...
}
```

3. For Docker deployments, mount or copy config.json to the container:
```bash
# Mount as volume
docker run -v ./config.json:/usr/share/nginx/html/config.json ...

# Or copy to container
docker cp config.json container:/usr/share/nginx/html/config.json
```

See `public/config.json.example` for all available options.

## Development

```bash
yarn install
yarn dev                    # Start dev server on :5173
yarn build                  # Production build
yarn typecheck              # Type check
yarn lint                   # Lint code
```

## Backend Environment Variables

See `.env.example` for complete reference:

| Variable | Purpose | Default |
| -- | -- | -- |
| `CHAIN_GRPC_ENDPOINT` | Chain gRPC endpoint | `localhost:9090` |
| `CHAIN_RPC_ENDPOINT` | Tendermint RPC (used by reset guard) | `http://localhost:26657` |
| `POSTGRES_USER` | Database role used by PostgREST/Yaci | `yaci` |
| `POSTGRES_PASSWORD` | DB password | `changeme` |
| `CHAIN_ID`, `CHAIN_NAME` | Override auto-detection | auto |
| `YACI_IMAGE` | Yaci image tag | `ghcr.io/cordtus/yaci:main` |
| `ENABLE_CHAIN_RESET_GUARD` | Auto-wipe DB when chain restarts | `false` |
| `RESET_GUARD_AUTO_TRUNCATE` | Whether the guard truncates automatically | `true` |

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

## Devnet resets & guard
- `yarn reset:full` loads `.env`, supplies sane defaults for bare-metal Postgres hosts, and runs `scripts/full-reset.sh` (which wraps `chain-reset-guard.sh`). Use this when you're not running via docker-compose; restart Yaci afterwards to re-ingest.
- `yarn redeploy:systemd` installs deps, runs the deploy build, executes the reset guard, and restarts the configured systemd services (`yaci-indexer`, `postgrest`, `yaci-explorer` by default). Override service names via `YACI_INDEXER_SERVICE`, `POSTGREST_SERVICE`, and `YACI_EXPLORER_SERVICE`. It skips prompts once the helper has run (`SKIP_ENV_PROMPTS=true` in `.env`); set `FORCE_ENV_PROMPTS=true` if you need to re-enter credentials.
- `scripts/update-yaci.sh` keeps the `cordtus/yaci` indexer up to date (clone -> fetch -> `make build`). `redeploy:systemd` runs it automatically unless `YACI_SKIP_UPDATE=true`; configure the branch/clone directory via `YACI_SOURCE_DIR`, `YACI_BRANCH`, `YACI_REPO_URL`, and `YACI_BUILD_CMD` in `.env`.
- `./scripts/reset-devnet.sh` stops the docker stack, wipes the Postgres volume, and restarts everything for a fresh genesis.
- Set `ENABLE_CHAIN_RESET_GUARD=true` (and provide `CHAIN_RPC_ENDPOINT`) to let the dockerized guard detect height rewinds/genesis changes and automatically truncate the index tables before Yaci starts.
- When running bare metal (no docker-compose defaults), make sure `.env` reflects the actual PostgreSQL target: set `POSTGRES_DB` to the real database name (often matching the chain, e.g. `republic`), and either export `POSTGRES_HOST` / `POSTGRES_PORT` or provide `RESET_GUARD_DB_URI=postgres://user:pass@host:port/db`. The same URI used in `/etc/postgrest.conf` (PostgREST's `db-uri`) can be copied directly so the reset guard truncates the correct database.
- Both `scripts/full-reset.sh` (bare-metal) and `scripts/chain-reset-guard.sh` (docker/systemd) now attempt to create `POSTGRES_DB` automatically when it's missing so renamed databases stay in sync across deployment styles. If the configured user lacks rights, you'll see a warning and should create the DB manually.
- The frontend reset banner (controlled via `VITE_RESET_NOTICE_*`) clears cached chain info/IBC metadata so the UI reflects the new chain immediately.

## License

MIT
