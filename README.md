# Yaci Block Explorer

Explorer UI for Cosmos SDK chains (with EVM support) backed by the [Yaci indexer](https://github.com/manifest-network/yaci).

## Highlights
- Auto-detects chain ID, denoms, and message types from the chain
- Cosmos + EVM transactions, live block updates, unified search
- IBC denom resolution (optional REST endpoint), cached in-browser
- Analytics: chain stats, gas efficiency, volume, top message types
- Built with React Router 7, TypeScript, Tailwind/shadcn, TanStack Query, Vite

## Docs
- Deployment and ops: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## Quick Start (Docker Compose)
```bash
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer
cp .env.example .env
# set CHAIN_GRPC_ENDPOINT and POSTGRES_PASSWORD in .env
docker compose -f docker/docker-compose.yml up -d
```
UI: http://localhost:3001 • PostgREST: http://localhost:3000 • Prometheus: http://localhost:2112

## Without Docker
Prereq: running PostgreSQL + PostgREST + Yaci indexer.
```bash
yarn install
yarn build
npx serve -s build/client -l 3001
```

## Key Env Vars (see `.env.example`)
| Variable | Purpose | Default |
| -- | -- | -- |
| `CHAIN_GRPC_ENDPOINT` | Chain gRPC endpoint | `localhost:9090` |
| `CHAIN_RPC_ENDPOINT` | Tendermint RPC (used by reset guard/banner) | `http://localhost:26657` |
| `POSTGRES_USER` | Database role used by PostgREST/Yaci | `yaci` |
| `POSTGRES_PASSWORD` | DB password | `changeme` |
| `VITE_POSTGREST_URL` | PostgREST base URL for the UI | `http://localhost:3000` |
| `VITE_CHAIN_REST_ENDPOINT` | REST endpoint for IBC denom traces | unset |
| `CHAIN_ID`, `CHAIN_NAME` | Override auto-detection | auto |
| `YACI_IMAGE` | Yaci image tag | `ghcr.io/cordtus/yaci:main` |
| `ENABLE_CHAIN_RESET_GUARD` | Auto-wipe DB when chain restarts | `false` |
| `RESET_GUARD_AUTO_TRUNCATE` | Whether the guard truncates automatically | `true` |

### Frontend config overrides (`VITE_*`)
All UI timing/limit constants can be tuned via env vars (see `.env.example`). Highlights:

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_TX_PAGE_SIZE` | Transactions per page | `20` |
| `VITE_SEARCH_ADDRESS_LIMIT` | Max address results checked | `20` |
| `VITE_ANALYTICS_*` | Lookbacks + refresh intervals for charts/cards | (various) |
| `VITE_RESET_NOTICE_ENABLED` | Toggle the chain-reset banner | `true` |
| `VITE_QUERY_*` | React Query cache timings | `10s` / `5m` |

Multi-chain: run separate compose stacks with unique `POSTGRES_PORT`, `POSTGREST_PORT`, `EXPLORER_PORT`.

## Project Structure
```
src/
  routes/         # file-based pages
  components/     # ui, common, analytics, JsonViewer
  lib/            # api clients, utils, chain-info
  config/         # chain presets
  types/          # TypeScript defs
```

## Development
```bash
yarn install
export VITE_POSTGREST_URL=http://localhost:3000
yarn dev
```
Scripts: `yarn typecheck`, `yarn lint`, `yarn build`.

## API (PostgREST)
- `/blocks_raw` – raw blocks
- `/transactions_main` – parsed transactions
- `/messages_main` – messages (for filters)
- `/events_main` – events
Example: `curl "http://localhost:3000/blocks_raw?order=id.desc&limit=10"`

## Chain Config (optional)
Add to `src/config/chains.ts` for custom symbols/features:
```ts
'your-chain-id': {
  name: 'Your Chain',
  nativeDenom: 'utoken',
  nativeSymbol: 'TOKEN',
  decimals: 6,
  features: { evm: false, ibc: true, wasm: true },
}
```

## Devnet resets & guard
- `npm run reset:full` (or `yarn reset:full`) loads `.env`, supplies sane defaults for bare-metal Postgres hosts, and runs `scripts/full-reset.sh` (which wraps `chain-reset-guard.sh`). Use this when you're not running via docker-compose; restart Yaci afterwards to re-ingest.
- `npm run redeploy:systemd` (or `yarn redeploy:systemd`) installs deps, runs the deploy build, executes the reset guard, and restarts the configured systemd services (`yaci-indexer`, `postgrest`, `yaci-explorer` by default). Override service names via `YACI_INDEXER_SERVICE`, `POSTGREST_SERVICE`, and `YACI_EXPLORER_SERVICE`.
- `scripts/update-yaci.sh` keeps the `cordtus/yaci` indexer up to date (clone → fetch → `make build`). `redeploy:systemd` runs it automatically unless `YACI_SKIP_UPDATE=true`; configure the branch/clone directory via `YACI_SOURCE_DIR`, `YACI_BRANCH`, `YACI_REPO_URL`, and `YACI_BUILD_CMD` in `.env`.
- `./scripts/reset-devnet.sh` stops the docker stack, wipes the Postgres volume, and restarts everything for a fresh genesis.
- Set `ENABLE_CHAIN_RESET_GUARD=true` (and provide `CHAIN_RPC_ENDPOINT`) to let the dockerized guard detect height rewinds/genesis changes and automatically truncate the index tables before Yaci starts.
- When running bare metal (no docker-compose defaults), make sure `.env` reflects the actual PostgreSQL target: set `POSTGRES_DB` to the real database name (often matching the chain, e.g. `republic`), and either export `POSTGRES_HOST` / `POSTGRES_PORT` or provide `RESET_GUARD_DB_URI=postgres://user:pass@host:port/db`. The same URI used in `/etc/postgrest.conf` (PostgREST’s `db-uri`) can be copied directly so the reset guard truncates the correct database.
- Both `scripts/full-reset.sh` (bare-metal) and `scripts/chain-reset-guard.sh` (docker/systemd) now attempt to create `POSTGRES_DB` automatically when it’s missing so renamed databases stay in sync across deployment styles. If the configured user lacks rights, you’ll see a warning and should create the DB manually.
- The frontend reset banner (controlled via `VITE_RESET_NOTICE_*`) clears cached chain info/IBC metadata so the UI reflects the new chain immediately.

## License
MIT (see LICENSE).
