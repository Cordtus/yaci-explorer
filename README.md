# Yaci Block Explorer

A modern, high-performance block explorer for Cosmos SDK chains with native EVM support. Built with React Router 7 and designed to work seamlessly with the [Yaci indexer](https://github.com/manifest-network/yaci).

## Features

- **High Performance**: Direct PostgreSQL integration via PostgREST for optimal query performance
- **Real-time Updates**: Live blockchain data synchronization
- **Dual Chain Support**: Native support for both Cosmos and EVM transactions
- **Modern UI**: Clean, responsive design with dark mode support using Radix UI + Tailwind CSS
- **Smart Search**: Unified search across blocks, transactions, and addresses
- **Rich Analytics**: Chain statistics, transaction history, gas efficiency, and performance metrics
- **Developer Friendly**: TypeScript, modern tooling, comprehensive documentation

## Tech Stack

- **Frontend**: React Router 7, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (Radix UI) components
- **State Management**: TanStack Query (React Query)
- **Charts**: ECharts for analytics visualization
- **Database**: PostgreSQL with PostgREST API
- **Indexer**: [Yaci](https://github.com/manifest-network/yaci) (Go-based blockchain indexer)
- **Build Tool**: Vite

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
│    (Docker Container)       │
└─────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- A running Cosmos SDK chain with gRPC endpoint

### Option 1: Docker Compose (Recommended)

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

### Option 2: Local Development

For frontend development with existing infrastructure:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Explorer available at http://localhost:5173
```

**Note**: This assumes you have PostgreSQL with indexed data and PostgREST running. See "Development Setup" below.

## Development

### Project Structure

```
src/
├── routes/          # React Router pages
│   ├── home.tsx              # Dashboard
│   ├── blocks.tsx            # Blocks list
│   ├── blocks.$id.tsx        # Block details
│   ├── transactions.tsx      # Transactions list
│   ├── transactions.$hash.tsx # Transaction details
│   └── analytics.tsx         # Analytics dashboard
├── components/      # React components
│   ├── ui/         # Base UI components (shadcn/ui)
│   ├── common/     # Shared components (search, denom display)
│   ├── layout/     # Layout components (header, nav)
│   └── analytics/  # Analytics/chart components
├── lib/            # Utilities and libraries
│   ├── api/        # API clients (PostgREST, Prometheus)
│   └── utils.ts    # Helper functions
├── types/          # TypeScript type definitions
├── styles/         # Global styles (Tailwind)
├── contexts/       # React contexts (DenomContext)
├── config/         # Chain configurations
└── root.tsx        # Root component with providers
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
npm run format:check     # Check formatting

# Clean
npm run clean            # Remove build artifacts
npm run clean:all        # Remove build + node_modules
npm run reinstall        # Clean all and reinstall
```

### Development Setup (Without Docker)

If you want to develop locally without Docker:

1. **Start PostgreSQL**:
   ```bash
   # Using Docker
   docker run -d --name postgres \
     -e POSTGRES_PASSWORD=foobar \
     -e POSTGRES_DB=yaci \
     -p 5432:5432 \
     postgres:15-alpine
   ```

2. **Run Yaci indexer**:
   ```bash
   # Option A: Using Docker
   docker run -d --name yaci \
     --network host \
     ghcr.io/manifest-network/yaci:latest \
     extract postgres YOUR_CHAIN_GRPC:9090 \
     -p postgres://postgres:foobar@localhost:5432/yaci \
     --live -k

   # Option B: From source
   # See: https://github.com/manifest-network/yaci
   ```

3. **Start PostgREST**:
   ```bash
   docker run -d --name postgrest \
     -p 3000:3000 \
     -e PGRST_DB_URI=postgres://postgres:foobar@localhost:5432/yaci \
     -e PGRST_DB_SCHEMA=api \
     -e PGRST_DB_ANON_ROLE=postgres \
     postgrest/postgrest:v12.0.2
   ```

4. **Start explorer**:
   ```bash
   npm install
   VITE_POSTGREST_URL=http://localhost:3000 npm run dev
   ```

## Configuration

### Environment Variables

See `.env.example` for all configuration options. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CHAIN_GRPC_ENDPOINT` | gRPC endpoint of chain to index | `localhost:9090` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `foobar` |
| `VITE_POSTGREST_URL` | PostgREST API URL for frontend (build-time) | `http://localhost:3000` |
| `POSTGREST_URL` | PostgREST API URL for docker-compose | `http://localhost:3000` |
| `CHAIN_ID` | Chain identifier for display | `manifest-1` |
| `YACI_IMAGE` | Yaci Docker image to use | `ghcr.io/manifest-network/yaci:latest` |

### Chain Configuration

To add support for a new chain, edit `src/config/chains.ts`:

```typescript
export const chains = {
  'your-chain-id': {
    name: 'Your Chain Name',
    features: {
      evm: true,    // EVM module support
      ibc: true,    // IBC support
      wasm: true,   // CosmWasm support
    },
    denoms: {
      // Native denomination config
    },
  }
}
```

## Deployment

### Production Deployment Scripts

For deploying to a production server with separate containers, use the provided deployment scripts:

```bash
# Quick deployment (pull latest code, build, and deploy)
./scripts/update-and-deploy.sh

# Or step by step:

# 1. Build for production (builds with /api as API endpoint)
./scripts/build-production.sh /api

# 2. Deploy to web server
./scripts/deploy.sh /var/www/mantrachain-explorer

# 3. Custom API URL
./scripts/build-production.sh https://api.yourdomain.com
```

**Script Options**:

- `build-production.sh [API_URL]` - Build with custom API endpoint
  - Default: `/api` (for reverse proxy setups)
  - Example: `/api`, `https://api.example.com`, `http://10.0.0.1:3000`

- `deploy.sh [WEBROOT_PATH]` - Deploy to web server directory
  - Default: `/var/www/mantrachain-explorer`
  - Automatically backs up existing deployment
  - Reloads Caddy or Nginx if running

- `update-and-deploy.sh [API_URL] [WEBROOT_PATH]` - Complete update workflow
  - Pulls latest code from git
  - Builds for production
  - Deploys to web server

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including reverse proxy setup with Caddy/Nginx.

### Production Deployment with Docker

```bash
# Build and start all services
docker compose -f docker/docker-compose.yml up -d --build

# Check status
docker compose -f docker/docker-compose.yml ps

# View logs
docker compose -f docker/docker-compose.yml logs -f explorer
```

### Using Pre-built Images

To use your own built images:

```bash
# Build explorer image
docker build -t myorg/yaci-explorer:latest -f docker/explorer/Dockerfile .

# Update docker-compose.yml to use your image
# Then start services
docker compose up -d
```

## API Endpoints

The PostgREST API provides RESTful endpoints for all indexed data:

- `GET /blocks_raw` - Raw block data
- `GET /transactions_main` - Parsed transactions
- `GET /messages_main` - Transaction messages
- `GET /events_main` - Transaction events
- `GET /normalized_events` - Standardized event attributes

All endpoints support:
- **Filtering**: `?field=eq.value`
- **Sorting**: `?order=field.desc`
- **Pagination**: `?limit=20&offset=0`
- **Selection**: `?select=field1,field2`

Example:
```bash
# Get recent blocks
curl "http://localhost:3000/blocks_raw?order=id.desc&limit=10"

# Get transactions for specific block
curl "http://localhost:3000/transactions_main?height=eq.12345"
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Add TSDoc comments to all new functions
4. Test your changes locally
5. Commit with descriptive messages
6. Push to your fork
7. Open a Pull Request

### Code Standards

- Use TSDoc/JSDoc comments for all exported functions
- Follow existing code style (Prettier + ESLint configured)
- Write type-safe TypeScript (no `any` types)
- Test UI changes across desktop and mobile viewports

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- **Yaci Indexer**: https://github.com/manifest-network/yaci
- **PostgREST**: https://postgrest.org/
- **Cosmos SDK**: https://github.com/cosmos/cosmos-sdk

## Support

- **Issues**: [GitHub Issues](https://github.com/Cordtus/yaci-explorer/issues)
- **Documentation**: See `/docs` folder (coming soon)
- **Indexer Issues**: [Yaci Issues](https://github.com/manifest-network/yaci/issues)
