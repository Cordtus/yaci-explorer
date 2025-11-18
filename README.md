# Yaci Block Explorer

A very basic block explorer for Cosmos SDK chains with native EVM support. Built to use the [Yaci indexer](https://github.com/manifest-network/yaci) as the backend to miniimze setup+config.

## Features

- **Plug and Play Support**: Works with any Cosmos SDK chain via automatic chain detection
- **Real-time Updates**: Live UI updates with new blocks
- **Dual Chain Support**: Native support for both Cosmos and EVM transactions
- **IBC Denom Resolution**: Automatic resolution of IBC denoms by querying chain's IBC module, with browser caching
- **Address/Wallet Search**: Unified search across blocks, transactions, and addresses
- **Rich Analytics**: Chain statistics, transaction history, gas efficiency, and performance metrics
- **Dynamic Filtering**: Message type filters auto-populated from actual chain data
- **Developer Friendly**: TypeScript, modern tooling, comprehensive documentation

## Dependencies

- **Frontend**: React Router 7, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (Radix UI components)
- **State Management**: TanStack Query (React Query)
- **Charts**: ECharts for analytics visualization
- **Database**: PostgreSQL with PostgREST API
- **Indexer**: [Yaci](https://github.com/manifest-network/yaci) - Go-based blockchain indexer with gRPC reflection for universal support
- **Build Tool**: Vite 7

## Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete guide for deploying to a new chain, redeploying existing setups and configuration.

## Quick Start

### Docker Compose (Recommended)

Start the complete stack including database, indexer, API, and explorer:

```bash
# Clone the repository
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer

# Copy and configure environment
cp .env.example .env
# Edit .env and set CHAIN_GRPC_ENDPOINT to your chain's gRPC endpoint

# Start all services
docker compose -f docker/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.yml logs -f
```

Access the explorer at **http://localhost:3001**

Services available:
- **Explorer UI**: http://localhost:3001
- **PostgREST API**: http://localhost:3000
- **Prometheus Metrics**: http://localhost:2112
- **PostgreSQL**: localhost:5432

### Dockerless Deployment

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Serve with any static server
npx serve -s build/client -l 3001
```

**Prerequisites**: PostgreSQL, PostgREST, and Yaci indexer must be running separately.

## Configuration

> **For full details**, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Environment Variables

Key configuration variables (see `.env.example` for complete list):

| Variable | Description | Default |
|----------|-------------|---------|
| `CHAIN_GRPC_ENDPOINT` | gRPC endpoint of chain to index | `localhost:9090` |
| `VITE_CHAIN_REST_ENDPOINT` | Chain REST API endpoint for IBC resolution | `http://localhost:1317` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `foobar` |
| `VITE_POSTGREST_URL` | PostgREST API URL for frontend | `http://localhost:3000` |
| `CHAIN_ID` | Chain identifier | Auto-detected |
| `CHAIN_NAME` | Display name | Auto-detected |
| `YACI_IMAGE` | Yaci Docker image | `ghcr.io/cordtus/yaci:main` |

### Multi-Chain Deployment

Deploy to multiple chains by running separate instances:

```bash
# Chain A
CHAIN_GRPC_ENDPOINT=chain-a.example.com:9090 \
POSTGRES_PORT=5432 \
POSTGREST_PORT=3000 \
EXPLORER_PORT=3001 \
docker compose up -d

# Chain B (different ports to avoid conflicts)
CHAIN_GRPC_ENDPOINT=chain-b.example.com:9090 \
POSTGRES_PORT=5433 \
POSTGREST_PORT=3002 \
EXPLORER_PORT=3003 \
docker compose up -d
```

## Development

### Project Structure

```
src/
├── routes/               # React Router pages (file-based routing)
│   ├── home.tsx         # Dashboard
│   ├── blocks.tsx       # Blocks list
│   ├── blocks.$id.tsx   # Block details
│   ├── transactions.tsx # Filterable Transactions list
│   └── analytics.tsx    # Analytics dashboard
├── components/
│   ├── ui/              # Base UI components
│   ├── common/          # Shared components
│   ├── analytics/       # Analytics/chart components
│   └── JsonViewer.tsx   # Interactive JSON viewer
├── lib/
│   ├── api/             # API clients
│   ├── utils.ts         # Helper functions
│   └── chain-info.ts    # Chain auto-detection
├── config/
│   └── chains.ts        # Multi-chain configurations
└── types/               # TypeScript definitions
```

### Local Development Setup

```bash
# Install dependencies
npm install

# Set PostgREST URL
export VITE_POSTGREST_URL=http://localhost:3000

# Start dev server
npm run dev
```

**Note**: Requires running PostgreSQL with indexed data and PostgREST. Use Docker Compose to start the backend stack separately.

## API Endpoints

The PostgREST API provides RESTful endpoints and support standard PostgREST query syntax:

- `GET /blocks_raw` - Raw block data
- `GET /transactions_main` - Parsed transactions
- `GET /messages_main` - Transaction messages (dynamically queried for filters)
- `GET /events_main` - Transaction events

Example:
```bash
# Get recent blocks
curl "http://localhost:3000/blocks_raw?order=id.desc&limit=10"

# Get transactions for specific block
curl "http://localhost:3000/transactions_main?height=eq.12345"

# Get distinct message types (used by filter dropdown)
curl "http://localhost:3000/messages_main?select=type&order=type.asc"
```

## Chain Compatibility

### Automatic Detection

The explorer automatically detects:
- Chain ID from block headers
- Native denomination from transactions
- Decimal places from denom prefix (`u` = 6, `a` = 18)
- Available message types from indexed data (list is dynamically generated)

### Fallback config

Add your chain to `src/config/chains.ts` (optional):

```typescript
'your-chain-id': {
  name: 'Your Chain',
  nativeDenom: 'utoken',
  nativeSymbol: 'TOKEN',
  decimals: 6,
  features: {
    evm: false,
    ibc: true,
    wasm: true,
  },
}
```

## License

MIT License - see LICENSE file for details.

## Related Projects

- **Yaci Indexer**: https://github.com/manifest-network/yaci
- **PostgREST**: https://postgrest.org/
- **Cosmos SDK**: https://github.com/cosmos/cosmos-sdk
