# Yaci Block Explorer

A modern, high-performance block explorer for Cosmos SDK chains with native EVM support. Built with React Router 7 and designed to work seamlessly with the [Yaci indexer](https://github.com/manifest-network/yaci).

## Features

- **Multi-Chain Support**: Works with any Cosmos SDK chain via automatic chain detection
- **High Performance**: Direct PostgreSQL integration via PostgREST for optimal query performance
- **Real-time Updates**: Live blockchain data synchronization
- **Dual Chain Support**: Native support for both Cosmos and EVM transactions
- **Modern UI**: Clean, responsive design with dark mode support using Radix UI + Tailwind CSS
- **Smart Search**: Unified search across blocks, transactions, and addresses
- **Rich Analytics**: Chain statistics, transaction history, gas efficiency, and performance metrics
- **Dynamic Filtering**: Message type filters auto-populated from actual chain data
- **Developer Friendly**: TypeScript, modern tooling, comprehensive documentation

## Tech Stack

- **Frontend**: React Router 7, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (Radix UI components)
- **State Management**: TanStack Query (React Query)
- **Charts**: ECharts for analytics visualization
- **Database**: PostgreSQL with PostgREST API
- **Indexer**: [Yaci](https://github.com/manifest-network/yaci) - Go-based blockchain indexer with gRPC reflection
- **Build Tool**: Vite 7

## Architecture

```
┌─────────────────────────────┐
│  React Router Frontend      │
│   (This Repository)         │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│      PostgREST API          │
│   (Auto-generated REST)     │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│       PostgreSQL            │
│   (Indexed Blockchain Data) │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│      Yaci Indexer           │
│  (gRPC → Database)          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│    Cosmos SDK Chain         │
│       (gRPC :9090)          │
└─────────────────────────────┘
```

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

### Native Deployment

For production deployment without Docker containers:

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Serve with any static server
npx serve -s build/client -l 3001
```

**Prerequisites**: PostgreSQL, PostgREST, and Yaci indexer must be running separately. See CLAUDE.md for detailed setup.

## Configuration

### Environment Variables

Key configuration variables (see `.env.example` for complete list):

| Variable | Description | Default |
|----------|-------------|---------|
| `CHAIN_GRPC_ENDPOINT` | gRPC endpoint of chain to index | `localhost:9090` |
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

See **MULTI_CHAIN.md** for detailed multi-chain deployment patterns and chain-specific configuration.

## Development

### Project Structure

```
src/
├── routes/               # React Router pages (file-based routing)
│   ├── home.tsx         # Dashboard
│   ├── blocks.tsx       # Blocks list
│   ├── blocks.$id.tsx   # Block details
│   ├── transactions.tsx # Transactions list with dynamic filters
│   └── analytics.tsx    # Analytics dashboard
├── components/
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── common/          # Shared components
│   ├── analytics/       # Analytics/chart components
│   └── JsonViewer.tsx   # Interactive JSON viewer
├── lib/
│   ├── api/             # API clients (PostgREST, Prometheus)
│   ├── utils.ts         # Helper functions
│   └── chain-info.ts    # Chain auto-detection
├── config/
│   └── chains.ts        # Multi-chain configurations
└── types/               # TypeScript definitions
```

### Development Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run lint:fix         # Auto-fix lint issues
npm run format           # Prettier formatting

# Maintenance
npm run clean            # Remove build artifacts
npm run reinstall        # Clean reinstall dependencies
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

The PostgREST API provides RESTful endpoints for all indexed data:

- `GET /blocks_raw` - Raw block data
- `GET /transactions_main` - Parsed transactions
- `GET /messages_main` - Transaction messages (dynamically queried for filters)
- `GET /events_main` - Transaction events

All endpoints support PostgREST query syntax:
- **Filtering**: `?field=eq.value`, `?field=gte.100`
- **Sorting**: `?order=field.desc`
- **Pagination**: `?limit=20&offset=0`
- **Selection**: `?select=field1,field2`
- **Count**: Add header `Prefer: count=exact`

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
- Available message types from indexed data

### Pre-configured Chains

Optimized configurations for major chains:
- Manifest Network (manifest-1)
- Cosmos Hub (cosmoshub-4)
- Juno (juno-1)
- Osmosis (osmosis-1)
- Stargaze (stargaze-1)
- Evmos (evmos_9001-2)
- Neutron (neutron-1)

Add your chain to `src/config/chains.ts` for optimal UX:

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

### Tested Compatibility

- **Cosmos SDK**: v0.45+ (uses gRPC reflection)
- **CometBFT**: All versions
- **EVM Support**: Chains with EVM module (e.g., Evmos, Mantra)
- **CosmWasm**: Chains with WASM support (e.g., Juno, Neutron)
- **IBC**: All IBC-enabled chains

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Add TSDoc comments to all new functions
4. Test your changes locally
5. Commit with descriptive messages
6. Open a Pull Request

### Code Standards

- TSDoc/JSDoc comments for all exported functions
- Type-safe TypeScript (avoid `any` types)
- Follow existing code style (Prettier + ESLint)
- Test UI changes across desktop and mobile

## Documentation

- **CLAUDE.md** - Development guide for AI assistants and developers
- **MULTI_CHAIN.md** - Multi-chain deployment patterns and chain-specific setup
- **.env.example** - Complete environment variable reference

## License

MIT License - see LICENSE file for details.

## Related Projects

- **Yaci Indexer**: https://github.com/manifest-network/yaci
- **PostgREST**: https://postgrest.org/
- **Cosmos SDK**: https://github.com/cosmos/cosmos-sdk

## Support

- **Explorer Issues**: [GitHub Issues](https://github.com/Cordtus/yaci-explorer/issues)
- **Indexer Issues**: [Yaci Repository](https://github.com/manifest-network/yaci)
