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
| `POSTGRES_USER` | Database role used by PostgREST/Yaci | `yaci` |
| `POSTGRES_PASSWORD` | DB password for that role | `changeme` |
| `VITE_POSTGREST_URL` | PostgREST base URL for the UI | `http://localhost:3000` |
| `VITE_CHAIN_REST_ENDPOINT` | REST endpoint for IBC denom traces | unset |
| `CHAIN_ID`, `CHAIN_NAME` | Override auto-detection | auto |
| `YACI_IMAGE` | Yaci image tag | `ghcr.io/cordtus/yaci:main` |

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

## License
MIT (see LICENSE).
