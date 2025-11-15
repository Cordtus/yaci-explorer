# CLAUDE.md - AI Assistant Guide for Yaci Block Explorer

**Last Updated:** 2025-11-15
**Repository:** Yaci Block Explorer
**Purpose:** This document provides AI assistants with comprehensive context about the codebase structure, conventions, and workflows.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Development Workflows](#development-workflows)
5. [Key Conventions](#key-conventions)
6. [Configuration Management](#configuration-management)
7. [API & Data Layer](#api--data-layer)
8. [Component Architecture](#component-architecture)
9. [State Management](#state-management)
10. [Routing](#routing)
11. [Styling & Theming](#styling--theming)
12. [Git Workflow](#git-workflow)
13. [Docker & Deployment](#docker--deployment)
14. [Common Tasks](#common-tasks)
15. [Troubleshooting](#troubleshooting)
16. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

### What is Yaci Block Explorer?

A modern, high-performance blockchain explorer for Cosmos SDK chains with native EVM support. Built to work with the [Yaci indexer](https://github.com/manifest-network/yaci), this explorer provides real-time blockchain data visualization through a clean, responsive interface.

### Key Features

- **Multi-Chain Support**: Works with any Cosmos SDK chain via automatic chain detection
- **High Performance**: Direct PostgreSQL integration via PostgREST for optimal query performance
- **Real-time Updates**: Live blockchain data synchronization
- **Dual Chain Support**: Native support for both Cosmos and EVM transactions
- **Modern UI**: Built with React Router 7, Radix UI, and Tailwind CSS
- **Smart Search**: Unified search across blocks, transactions, and addresses
- **Rich Analytics**: Chain statistics, transaction history, gas efficiency metrics
- **Dynamic Filtering**: Message type filters auto-populated from actual chain data

### Core Technology Philosophy

- **Type Safety**: Strict TypeScript throughout, minimal `any` usage
- **Documentation**: TSDoc comments for all exported functions
- **Performance**: Client-side caching, efficient API queries, SSR disabled for optimal CDN caching
- **Accessibility**: Built on Radix UI primitives for ARIA compliance
- **Developer Experience**: Hot reload, comprehensive type definitions, clear error messages

---

## Architecture & Tech Stack

### System Architecture

```
┌─────────────────────────────┐
│  React Router Frontend      │  ← This Repository
│   (Client-Side Rendering)   │
└─────────────┬───────────────┘
              │ HTTP/REST
              ▼
┌─────────────────────────────┐
│      PostgREST API          │  ← Auto-generated REST API
│   (PostgreSQL → REST)       │     from database schema
└─────────────┬───────────────┘
              │ SQL
              ▼
┌─────────────────────────────┐
│       PostgreSQL            │  ← Indexed blockchain data
│   (api schema: views)       │     Optimized views for queries
└─────────────┬───────────────┘
              │ Direct Write
              ▼
┌─────────────────────────────┐
│      Yaci Indexer           │  ← Go-based gRPC indexer
│  (gRPC → Database)          │     with reflection support
└─────────────┬───────────────┘
              │ gRPC
              ▼
┌─────────────────────────────┐
│    Cosmos SDK Chain         │  ← Any Cosmos chain
│       (gRPC :9090)          │     with gRPC enabled
└─────────────────────────────┘
```

### Frontend Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **React Router** | 7.9.4 | File-based routing, SSR framework (SSR disabled) |
| **TypeScript** | 5.7.3 | Type safety and developer experience |
| **Tailwind CSS** | 3.4.17 | Utility-first styling |
| **Radix UI** | Various | Accessible component primitives |
| **shadcn/ui** | N/A | Pre-styled Radix components (customizable) |
| **TanStack Query** | 5.62.11 | Server state management, caching |
| **ECharts** | 5.6.0 | Analytics and data visualization |
| **Vite** | 7.1.9 | Build tool and dev server |
| **ethers.js** | 6.13.5 | EVM address/data parsing |

### Backend Stack (Infrastructure)

- **PostgreSQL** 15-alpine: Primary data store
- **PostgREST** v12.0.2: Auto-generated REST API
- **Yaci Indexer**: Go-based blockchain indexer (separate repo)
- **Prometheus** (optional): Metrics collection from Yaci
- **Caddy/Nginx**: Reverse proxy for production deployments

---

## Project Structure

### Directory Layout

```
yaci-explorer/
├── src/
│   ├── routes/                    # React Router pages (file-based routing)
│   │   ├── home.tsx              # Dashboard (index route)
│   │   ├── blocks.tsx            # Blocks list
│   │   ├── blocks.$id.tsx        # Block detail page
│   │   ├── transactions.tsx      # Transactions list with filters
│   │   ├── transactions.$hash.tsx # Transaction detail page
│   │   ├── analytics.tsx         # Analytics dashboard
│   │   └── addr.$id.tsx          # Address detail page
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...               # More Radix UI-based components
│   │   ├── layout/               # Layout components
│   │   │   └── header.tsx        # App header with search
│   │   ├── common/               # Shared business components
│   │   ├── analytics/            # Chart components
│   │   ├── JsonViewer.tsx        # Interactive JSON viewer
│   │   └── MessageDetails.tsx    # Transaction message renderer
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts         # YaciAPIClient class (PostgREST wrapper)
│   │   │   └── prometheus.ts     # Prometheus metrics client
│   │   ├── utils.ts              # Utility functions (cn, formatters)
│   │   ├── chain-info.ts         # Runtime chain detection
│   │   └── denom.ts              # Denomination helpers
│   │
│   ├── config/
│   │   └── chains.ts             # Multi-chain configurations
│   │
│   ├── types/
│   │   └── blockchain.ts         # TypeScript type definitions
│   │
│   ├── contexts/
│   │   └── DenomContext.tsx      # Denomination context provider
│   │
│   ├── hooks/
│   │   └── useDenomResolver.ts   # Custom denomination hook
│   │
│   ├── styles/
│   │   └── globals.css           # Global styles and CSS variables
│   │
│   ├── routes.ts                 # Route configuration
│   └── entry.client.tsx          # Client entry point
│
├── docker/
│   ├── docker-compose.yml        # Complete stack orchestration
│   └── explorer/
│       ├── Dockerfile            # Frontend production build
│       └── nginx.conf            # Nginx reverse proxy config
│
├── public/                       # Static assets
├── scripts/                      # Build and deployment scripts
│
├── .env.example                  # Environment variable template
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── vite.config.ts                # Vite build configuration
├── react-router.config.ts        # React Router settings (SSR disabled)
├── postcss.config.js             # PostCSS configuration
└── components.json               # shadcn/ui configuration
```

### File Naming Conventions

- **Routes**: Use React Router 7 file-based routing conventions
  - `home.tsx` → `/` (index route)
  - `blocks.tsx` → `/blocks`
  - `blocks.$id.tsx` → `/blocks/:id` (dynamic parameter)
  - `addr.$id.tsx` → `/addr/:id`

- **Components**: PascalCase for files and exports
  - `Button.tsx` exports `Button`
  - `JsonViewer.tsx` exports `JsonViewer`

- **Utilities/Hooks**: camelCase for files
  - `useDenomResolver.ts` exports `useDenomResolver`
  - `utils.ts` exports multiple utility functions

- **Types**: PascalCase interfaces/types in `blockchain.ts`
  - `Block`, `Transaction`, `EnhancedTransaction`, etc.

---

## Development Workflows

### Initial Setup

```bash
# Clone repository
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env to set PostgREST URL
# For local development:
export VITE_POSTGREST_URL=http://localhost:3000

# Start development server
npm run dev
# Opens on http://localhost:5173
```

### Development Commands

```bash
# Development
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Production build to /build
npm run preview          # Preview production build
npm run start            # Serve production build

# Code Quality
npm run type-check       # TypeScript type checking (no emit)
npm run typecheck        # Generate types + type check
npm run lint             # ESLint (report only)
npm run lint:fix         # ESLint with auto-fix
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Maintenance
npm run clean            # Remove build artifacts
npm run clean:all        # Remove build + node_modules
npm run reinstall        # Clean reinstall
npm run deploy:build     # Production deployment build
```

### Local Development with Backend

**Option 1: Docker Compose (Recommended)**

```bash
# Start complete stack (DB + PostgREST + Yaci + Explorer)
docker compose -f docker/docker-compose.yml up -d

# Explorer available at http://localhost:3001
# PostgREST available at http://localhost:3000
```

**Option 2: Development Mode**

```bash
# Start backend only (DB + PostgREST + Yaci)
docker compose -f docker/docker-compose.yml up postgres postgrest yaci -d

# Set PostgREST URL
export VITE_POSTGREST_URL=http://localhost:3000

# Start frontend dev server
npm run dev
# Available at http://localhost:5173
```

### Hot Reload Behavior

- **File changes**: Instant HMR (Hot Module Replacement)
- **Route changes**: Must be added to `src/routes.ts`
- **Type changes**: May require dev server restart
- **Config changes**: Require dev server restart

---

## Key Conventions

### TypeScript Standards

1. **Strict Mode**: All TypeScript strict checks enabled
   ```typescript
   // tsconfig.json
   "strict": true
   ```

2. **Avoid `any`**: Use proper types or `unknown` if necessary
   ```typescript
   // ❌ Bad
   function process(data: any) { ... }

   // ✅ Good
   function process(data: Block) { ... }

   // ✅ Acceptable for truly dynamic data
   function process(data: unknown) {
     if (isBlock(data)) { ... }
   }
   ```

3. **TSDoc Comments**: Required for all exported functions
   ```typescript
   /**
    * Fetches a paginated list of blocks from the blockchain
    * @param limit - Maximum number of blocks to return (default: 20)
    * @param offset - Number of blocks to skip for pagination (default: 0)
    * @returns Promise resolving to paginated response containing blocks
    * @throws {Error} If the API request fails
    * @example
    * const result = await client.getBlocks(10, 0);
    * console.log(`Retrieved ${result.data.length} blocks`);
    */
   async getBlocks(limit = 20, offset = 0): Promise<PaginatedResponse<Block>>
   ```

4. **Path Aliases**: Use absolute imports with `@/` prefix
   ```typescript
   // ✅ Good
   import { YaciAPIClient } from '@/lib/api/client'
   import { Button } from '@/components/ui/button'

   // ❌ Avoid
   import { YaciAPIClient } from '../../lib/api/client'
   ```

### Code Organization

1. **Component Structure**:
   ```typescript
   // Imports: external, then internal
   import React from 'react'
   import { useQuery } from '@tanstack/react-query'

   import { Button } from '@/components/ui/button'
   import { formatTimestamp } from '@/lib/utils'

   // Types/Interfaces
   interface BlockListProps {
     initialBlocks?: Block[]
   }

   // Component
   export default function BlockList({ initialBlocks }: BlockListProps) {
     // Hooks
     const { data, isLoading } = useQuery(...)

     // Early returns
     if (isLoading) return <div>Loading...</div>

     // Render
     return (...)
   }
   ```

2. **API Client Patterns**:
   - All PostgREST calls go through `YaciAPIClient` class
   - Caching implemented at client level (10s TTL)
   - Error handling with descriptive messages
   - Type-safe responses

3. **Naming Conventions**:
   - **Components**: PascalCase (`BlockList`, `TransactionTable`)
   - **Functions**: camelCase (`formatTimestamp`, `getChainInfo`)
   - **Constants**: SCREAMING_SNAKE_CASE (`CHAIN_CONFIGS`, `MAX_RETRIES`)
   - **Types/Interfaces**: PascalCase (`Block`, `ChainConfig`)
   - **React hooks**: camelCase with `use` prefix (`useChainInfo`, `useDenomResolver`)

### Formatting & Linting

- **Prettier**: 2-space indentation, single quotes, no semicolons (enforced)
- **ESLint**: React hooks rules, TypeScript recommended rules
- **Run before commit**:
  ```bash
  npm run format && npm run lint:fix && npm run type-check
  ```

---

## Configuration Management

### Environment Variables

**File**: `.env.example` → `.env` (local)

```bash
# PostgreSQL (for Docker Compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=foobar
POSTGRES_DB=yaci
POSTGRES_PORT=5432

# PostgREST API
PGRST_DB_SCHEMA=api
POSTGREST_PORT=3000

# Frontend API URL (IMPORTANT)
# Development (direct access): http://localhost:3000
# Production (via reverse proxy): /api (relative path)
VITE_POSTGREST_URL=/api

# Yaci Indexer
YACI_IMAGE=ghcr.io/cordtus/yaci:main
CHAIN_GRPC_ENDPOINT=host.docker.internal:9090  # Chain to index
YACI_MAX_CONCURRENCY=100
YACI_LOG_LEVEL=info
YACI_INSECURE=-k  # Use -k for non-TLS gRPC
YACI_METRICS_PORT=2112

# Chain Metadata (optional, auto-detected)
CHAIN_ID=manifest-1
CHAIN_NAME=Manifest Network

# Explorer UI Port
EXPLORER_PORT=3001
```

### Chain Configurations

**File**: `src/config/chains.ts`

Add new chains here for optimized detection:

```typescript
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'your-chain-id': {
    name: 'Your Chain Name',
    features: {
      evm: false,      // Has EVM module?
      ibc: true,       // Has IBC support?
      wasm: false,     // Has CosmWasm?
      customModules: ['custom-module-name'], // Optional
    },
    nativeDenom: 'utoken',     // Base denomination
    nativeSymbol: 'TOKEN',      // Display symbol
    decimals: 6,                // Decimal places (6 for micro, 18 for atto)
    rpcEndpoint: 'https://rpc.example.com',      // Optional
    restEndpoint: 'https://api.example.com',     // Optional
  },
}
```

**Auto-detection fallback**: If chain not in `CHAIN_CONFIGS`, the app will:
1. Detect chain ID from latest block
2. Auto-detect denom from transactions
3. Infer decimals from denom prefix (`u` = 6, `a` = 18)
4. Use default features (IBC only)

### Build Configuration

**React Router** (`react-router.config.ts`):
```typescript
export default {
  ssr: false,        // SSR disabled for optimal CDN caching
  appDirectory: "src",
} satisfies Config;
```

**Vite** (`vite.config.ts`): Standard React + Vite setup

**Tailwind** (`tailwind.config.ts`):
- CSS variables for theming (`--primary`, `--background`, etc.)
- Dark mode: `class` strategy (not implemented yet)
- Custom animations for Radix components

---

## API & Data Layer

### PostgREST Integration

**Base URL**: Configured via `VITE_POSTGREST_URL`

**Schema**: `api` schema in PostgreSQL (read-only views)

**Tables/Views**:
- `blocks_raw`: Complete block data (JSONB)
- `transactions_main`: Parsed transactions with fees
- `messages_main`: Individual messages within transactions
- `events_main`: Transaction events

### YaciAPIClient Class

**Location**: `src/lib/api/client.ts`

**Key Methods**:

```typescript
const api = new YaciAPIClient() // Uses VITE_POSTGREST_URL

// Blocks
await api.getBlocks(limit, offset)
await api.getBlock(height)
await api.getLatestBlock()

// Transactions
await api.getTransactions(limit, offset, filters)
await api.getTransaction(hash)

// Address lookups
await api.getTransactionsByAddress(address, limit, offset)
await api.getAddressStats(address)

// Search
await api.search(query) // Auto-detects block/tx/address

// Analytics
await api.getChainStats()
await api.getTransactionVolumeOverTime(days)
await api.getTransactionTypeDistribution()
await api.getBlockTimeAnalysis(limit)

// Message types
await api.getDistinctMessageTypes()
```

### PostgREST Query Patterns

**Filtering**:
```typescript
// Equality
?id=eq.12345

// Comparison
?height=gte.100&height=lte.200

// Null checks
?error=is.null        // Successful transactions
?error=not.is.null    // Failed transactions

// Array containment (PostgreSQL syntax)
?mentions.cs.%7Baddress%7D  // {address} URL-encoded
```

**Pagination**:
```typescript
?limit=20&offset=40    // Page 3 (20 per page)

// Add header for total count
headers: { 'Prefer': 'count=exact' }
// Returns: Content-Range: 40-59/1234
```

**Sorting**:
```typescript
?order=id.desc         // Descending by ID
?order=timestamp.asc   // Ascending by timestamp
```

### Caching Strategy

1. **Client-side cache**: 10-second TTL in `YaciAPIClient`
2. **React Query cache**: 5-minute stale time (configurable per query)
3. **No server cache**: PostgREST is stateless

Example with React Query:
```typescript
const { data } = useQuery({
  queryKey: ['blocks', page],
  queryFn: () => api.getBlocks(20, page * 20),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  refetchInterval: 30000,     // Auto-refresh every 30s
})
```

---

## Component Architecture

### UI Component Library

**shadcn/ui**: Copy-paste components based on Radix UI

**Location**: `src/components/ui/`

**Installation** (when adding new components):
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
```

**Customization**: Edit files directly in `src/components/ui/`

### Component Categories

**1. UI Primitives** (`src/components/ui/`)
- `button.tsx`, `card.tsx`, `table.tsx`
- `dialog.tsx`, `select.tsx`, `tooltip.tsx`
- `badge.tsx`, `skeleton.tsx`, `tabs.tsx`

**2. Layout Components** (`src/components/layout/`)
- `header.tsx`: Main navigation with search bar

**3. Business Components** (`src/components/common/`)
- Reusable domain-specific components

**4. Analytics Components** (`src/components/analytics/`)
- Chart wrappers around ECharts
- `FeeRevenueChart.tsx`, etc.

**5. Feature Components**
- `JsonViewer.tsx`: Collapsible JSON viewer
- `MessageDetails.tsx`: Transaction message renderer

### Component Patterns

**Standard Component**:
```typescript
import { Card } from '@/components/ui/card'
import { formatTimestamp } from '@/lib/utils'
import type { Block } from '@/types/blockchain'

interface BlockCardProps {
  block: Block
  showDetails?: boolean
}

export function BlockCard({ block, showDetails = false }: BlockCardProps) {
  return (
    <Card>
      <h3>Block #{block.id}</h3>
      <p>{formatTimestamp(block.data.block.header.time)}</p>
      {showDetails && <div>...</div>}
    </Card>
  )
}
```

**Route Component** (page-level):
```typescript
import { useLoaderData } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { YaciAPIClient } from '@/lib/api/client'

const api = new YaciAPIClient()

export default function BlocksPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.getBlocks(20, 0),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Blocks</h1>
      {/* Render blocks */}
    </div>
  )
}
```

---

## State Management

### TanStack Query (React Query)

**Primary state management** for server data.

**Setup**: Configured in entry point with dev tools

**Common Patterns**:

```typescript
// Simple query
const { data, isLoading, error } = useQuery({
  queryKey: ['blocks', page],
  queryFn: () => api.getBlocks(20, page * 20),
})

// With options
const { data, isLoading, error } = useQuery({
  queryKey: ['transaction', hash],
  queryFn: () => api.getTransaction(hash),
  staleTime: 5 * 60 * 1000,      // 5 minutes
  refetchInterval: 30000,         // Refresh every 30s
  retry: 3,                       // Retry failed requests
  enabled: !!hash,                // Conditional fetching
})

// Dependent queries
const { data: block } = useQuery({
  queryKey: ['block', height],
  queryFn: () => api.getBlock(height),
})

const { data: txs } = useQuery({
  queryKey: ['txs', height],
  queryFn: () => api.getTransactions(20, 0, { block_height: height }),
  enabled: !!block,  // Only fetch when block is loaded
})
```

### Local State

Use React `useState` for:
- UI state (modals, dropdowns, tabs)
- Form inputs
- Pagination controls

```typescript
const [page, setPage] = useState(0)
const [filters, setFilters] = useState<Filters>({})
```

### Context API

**DenomContext** (`src/contexts/DenomContext.tsx`):
- Provides chain denomination info app-wide
- Auto-detects from blockchain data
- Accessible via `useDenomResolver()` hook

```typescript
import { useDenomResolver } from '@/hooks/useDenomResolver'

function Component() {
  const { formatAmount } = useDenomResolver()

  return <div>{formatAmount('1000000', 'umfx')}</div>
  // Output: "1 MFX"
}
```

---

## Routing

### React Router 7 File-Based Routing

**Configuration**: `src/routes.ts`

```typescript
export default [
  index("routes/home.tsx"),                      // /
  route("blocks", "routes/blocks.tsx"),          // /blocks
  route("blocks/:id", "routes/blocks.$id.tsx"),  // /blocks/123
  route("transactions", "routes/transactions.tsx"),
  route("transactions/:hash", "routes/transactions.$hash.tsx"),
  route("analytics", "routes/analytics.tsx"),
  route("addr/:id", "routes/addr.$id.tsx"),      // /addr/manifest1...
] satisfies RouteConfig;
```

### Adding New Routes

1. Create route file in `src/routes/`
2. Add to `src/routes.ts`
3. Restart dev server

**Example**: Add `/validators` route

```typescript
// src/routes/validators.tsx
export default function ValidatorsPage() {
  return <div>Validators</div>
}
```

```typescript
// src/routes.ts
export default [
  index("routes/home.tsx"),
  route("validators", "routes/validators.tsx"),  // Add this
  // ... other routes
] satisfies RouteConfig;
```

### Navigation

```typescript
import { Link } from 'react-router'

<Link to="/blocks">View Blocks</Link>
<Link to={`/blocks/${block.id}`}>Block #{block.id}</Link>
<Link to={`/transactions/${txHash}`}>View Transaction</Link>
```

### Route Parameters

```typescript
import { useParams } from 'react-router'

export default function BlockDetailPage() {
  const { id } = useParams()  // From /blocks/:id

  const { data: block } = useQuery({
    queryKey: ['block', id],
    queryFn: () => api.getBlock(Number(id)),
  })

  return <div>Block {id}</div>
}
```

---

## Styling & Theming

### Tailwind CSS

**Utility-first** styling approach.

**Common patterns**:
```tsx
<div className="container mx-auto p-4">
  <h1 className="text-2xl font-bold mb-4">Title</h1>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card className="p-6 hover:shadow-lg transition-shadow">
      Content
    </Card>
  </div>
</div>
```

### CSS Variables & Theming

**Location**: `src/styles/globals.css`

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... more variables */
}
```

**Usage in Tailwind**:
```tsx
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>
```

### Dark Mode (Not Implemented Yet)

**Strategy**: `class` based (configured in `tailwind.config.ts`)

**To implement**:
1. Add dark mode toggle component
2. Apply `dark` class to root element
3. Define dark mode variables in `globals.css`

### Component Styling with CVA

**Class Variance Authority** for variant-based styling:

```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

---

## Git Workflow

### Branch Naming

- `main`: Production-ready code
- `develop`: Integration branch (if used)
- `feature/description`: New features
- `fix/description`: Bug fixes
- `refactor/description`: Code refactoring
- `docs/description`: Documentation updates

**Examples**:
- `feature/add-validator-page`
- `fix/transaction-pagination`
- `refactor/api-client-caching`

### Commit Messages

**Format**: `type: concise description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons
- `test`: Adding tests
- `chore`: Build process, dependencies

**Examples**:
```
feat: add validator list page with staking info
fix: correct pagination offset calculation in transactions
refactor: extract API client caching logic
docs: update README with multi-chain deployment
chore: upgrade React Router to v7.9.4
```

### Pull Request Workflow

1. Create feature branch from `main`
2. Make changes, commit incrementally
3. Run quality checks:
   ```bash
   npm run format && npm run lint:fix && npm run type-check
   ```
4. Push to remote
5. Open PR with description
6. Address review feedback
7. Squash and merge

---

## Docker & Deployment

### Docker Compose Stack

**File**: `docker/docker-compose.yml`

**Services**:
1. **postgres**: PostgreSQL 15-alpine
2. **postgrest**: PostgREST v12.0.2
3. **yaci**: Blockchain indexer
4. **explorer**: Frontend UI (Nginx)

**Start entire stack**:
```bash
# Copy and configure .env
cp .env.example .env
# Edit CHAIN_GRPC_ENDPOINT to your chain

# Start all services
docker compose -f docker/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.yml logs -f explorer

# Stop stack
docker compose -f docker/docker-compose.yml down
```

### Multi-Chain Deployment

**Strategy**: Separate Docker Compose instances per chain

```bash
# Chain A (Manifest)
CHAIN_GRPC_ENDPOINT=grpc.manifest.nodestake.top:443 \
CHAIN_ID=manifest-1 \
POSTGRES_PORT=5432 \
POSTGREST_PORT=3000 \
EXPLORER_PORT=3001 \
docker compose -f docker/docker-compose.yml up -d

# Chain B (Osmosis) - different ports
CHAIN_GRPC_ENDPOINT=grpc.osmosis.zone:443 \
CHAIN_ID=osmosis-1 \
POSTGRES_PORT=5433 \
POSTGREST_PORT=3002 \
EXPLORER_PORT=3003 \
docker compose -f docker/docker-compose.yml up -d
```

### Production Deployment

**Option 1: Docker Compose** (simple)
- Use `.env` for configuration
- Run behind reverse proxy (Caddy/Nginx)
- Set `VITE_POSTGREST_URL=/api` for relative path

**Option 2: Native Build** (advanced)
```bash
# Build frontend
npm run build

# Output: /build/client (static files)

# Serve with any static server
npx serve -s build/client -l 3001

# Or use Nginx, Caddy, etc.
```

**Reverse Proxy** (Caddy example):
```
explore.example.com {
    handle /api/* {
        reverse_proxy http://localhost:3000
    }
    handle {
        reverse_proxy http://localhost:3001
    }
}
```

### Environment-Specific Configs

**Development**:
```bash
VITE_POSTGREST_URL=http://localhost:3000
```

**Production**:
```bash
VITE_POSTGREST_URL=/api  # Relative path via reverse proxy
```

---

## Common Tasks

### Task 1: Add a New Chain Configuration

```typescript
// src/config/chains.ts
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  // ... existing chains
  'republic-1': {
    name: 'Republic Network',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
    },
    nativeDenom: 'urepub',
    nativeSymbol: 'REPUB',
    decimals: 6,
    rpcEndpoint: 'https://rpc.republic.example.com',
    restEndpoint: 'https://api.republic.example.com',
  },
}
```

### Task 2: Add a New shadcn/ui Component

```bash
# List available components
npx shadcn-ui@latest add

# Add specific component
npx shadcn-ui@latest add dropdown-menu

# Component added to src/components/ui/dropdown-menu.tsx
# Import and use:
import { DropdownMenu } from '@/components/ui/dropdown-menu'
```

### Task 3: Add a New Analytics Chart

```typescript
// src/components/analytics/ValidatorDistribution.tsx
import ReactECharts from 'echarts-for-react'

export function ValidatorDistribution({ data }) {
  const option = {
    title: { text: 'Validator Distribution' },
    tooltip: {},
    xAxis: { type: 'category', data: data.map(v => v.name) },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: data.map(v => v.power) }],
  }

  return <ReactECharts option={option} />
}
```

### Task 4: Add API Client Method

```typescript
// src/lib/api/client.ts
export class YaciAPIClient {
  // ... existing methods

  /**
   * Fetches validator set for current block
   * @returns Promise resolving to array of validators
   */
  async getValidators(): Promise<Validator[]> {
    // Implementation using PostgREST
    const response = await fetch(`${this.baseUrl}/validators`)
    if (!response.ok) {
      throw new Error('Failed to fetch validators')
    }
    return response.json()
  }
}
```

### Task 5: Create a New Route Page

```bash
# 1. Create route file
# src/routes/validators.tsx
```

```typescript
import { useQuery } from '@tanstack/react-query'
import { YaciAPIClient } from '@/lib/api/client'

const api = new YaciAPIClient()

export default function ValidatorsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['validators'],
    queryFn: () => api.getValidators(),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Validators</h1>
      {/* Render validators */}
    </div>
  )
}
```

```typescript
// 2. Add to src/routes.ts
export default [
  // ... existing routes
  route("validators", "routes/validators.tsx"),
] satisfies RouteConfig;
```

```bash
# 3. Restart dev server
```

### Task 6: Update Chain from gRPC Endpoint

```bash
# Update .env
CHAIN_GRPC_ENDPOINT=grpc://new-chain.example.com:9090
CHAIN_ID=new-chain-1  # Optional, will auto-detect
CHAIN_NAME=New Chain   # Optional, will auto-detect

# Restart Docker services
docker compose -f docker/docker-compose.yml restart yaci explorer
```

---

## Troubleshooting

### Issue: "VITE_POSTGREST_URL is not set"

**Cause**: Environment variable not loaded

**Solution**:
```bash
# Check .env file exists
ls .env

# Set manually for dev
export VITE_POSTGREST_URL=http://localhost:3000

# Or add to .env
echo "VITE_POSTGREST_URL=http://localhost:3000" >> .env
```

### Issue: PostgREST Returns Empty Results

**Cause**: Database schema mismatch or indexer not running

**Debugging**:
```bash
# Check PostgREST is running
curl http://localhost:3000/blocks_raw?limit=1

# Check Yaci indexer logs
docker logs yaci-explorer-indexer

# Verify PostgreSQL has data
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci
# Run: SELECT COUNT(*) FROM api.blocks_raw;
```

### Issue: React Router Not Finding Route

**Cause**: Route not registered in `routes.ts` or dev server not restarted

**Solution**:
1. Verify route in `src/routes.ts`
2. Restart dev server
3. Check browser console for errors

### Issue: Type Errors in IDE

**Cause**: TypeScript server out of sync

**Solution**:
```bash
# Regenerate types
npm run typecheck

# Restart TypeScript server in VS Code
# CMD+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: Docker Compose Services Not Starting

**Cause**: Port conflicts or missing environment variables

**Debugging**:
```bash
# Check logs
docker compose -f docker/docker-compose.yml logs

# Check port conflicts
lsof -i :3000  # PostgREST
lsof -i :5432  # PostgreSQL
lsof -i :3001  # Explorer

# Verify .env file
cat .env | grep POSTGRES_PASSWORD
```

### Issue: Chain Not Detected Correctly

**Cause**: Chain config missing or gRPC endpoint incorrect

**Solution**:
1. Add chain to `src/config/chains.ts`
2. Verify gRPC endpoint is accessible
3. Check Yaci logs for connection errors
4. Clear browser cache and reload

---

## AI Assistant Guidelines

### When Working with This Codebase

**DO**:
- ✅ Use TypeScript strict mode, avoid `any`
- ✅ Add TSDoc comments to new functions
- ✅ Use path aliases (`@/lib/utils` not `../../lib/utils`)
- ✅ Follow React Query patterns for server state
- ✅ Add new routes to `src/routes.ts`
- ✅ Use shadcn/ui components from `src/components/ui/`
- ✅ Format with Prettier before committing
- ✅ Test with `npm run type-check` before pushing
- ✅ Use `YaciAPIClient` class for all API calls
- ✅ Handle loading and error states in components
- ✅ Use semantic commit messages

**DON'T**:
- ❌ Modify PostgREST schema (read-only from frontend perspective)
- ❌ Hardcode chain-specific logic (use `CHAIN_CONFIGS`)
- ❌ Fetch data in components without React Query
- ❌ Use inline styles (use Tailwind classes)
- ❌ Import from `node_modules` directly (use installed packages)
- ❌ Create new global state without justification (prefer React Query)
- ❌ Skip error handling in API calls
- ❌ Commit without running linters

### Understanding the Data Flow

1. **Blockchain** → gRPC → **Yaci Indexer**
2. **Yaci** → SQL → **PostgreSQL** (`api` schema)
3. **PostgREST** → Auto-generates REST API from schema
4. **YaciAPIClient** → Wraps PostgREST with type-safe methods
5. **React Query** → Caches and manages server state
6. **Components** → Display data with Tailwind + Radix UI

### Key Files to Reference

When making changes, always check:
- `src/types/blockchain.ts`: Type definitions
- `src/config/chains.ts`: Chain configurations
- `src/lib/api/client.ts`: API client methods
- `src/routes.ts`: Route configuration
- `.env.example`: Environment variables
- `package.json`: Available scripts

### Testing Changes

**Before committing**:
```bash
# 1. Type check
npm run type-check

# 2. Lint
npm run lint:fix

# 3. Format
npm run format

# 4. Build test
npm run build

# 5. Manual testing in browser
npm run dev
```

### Common Patterns to Follow

**Fetching paginated data**:
```typescript
const [page, setPage] = useState(0)
const limit = 20

const { data, isLoading } = useQuery({
  queryKey: ['blocks', page],
  queryFn: () => api.getBlocks(limit, page * limit),
})
```

**Error boundaries**:
```typescript
if (error) {
  return (
    <div className="p-4 text-red-600">
      Error: {error.message}
    </div>
  )
}
```

**Loading states**:
```typescript
if (isLoading) {
  return <Skeleton className="h-24 w-full" />
}
```

### Multi-Chain Considerations

This explorer is designed to work with **any** Cosmos SDK chain:
- Don't hardcode chain-specific logic
- Use `CHAIN_CONFIGS` for known chains
- Fall back to auto-detection for unknown chains
- Test with multiple chains if possible

### Performance Considerations

- React Query caching reduces API calls
- PostgREST is fast but limit large queries
- Use pagination for all list views
- Consider virtualization for very long lists
- Optimize ECharts options for performance

---

## Additional Resources

### External Documentation

- **React Router 7**: https://reactrouter.com/
- **TanStack Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/docs/primitives
- **shadcn/ui**: https://ui.shadcn.com/
- **PostgREST**: https://postgrest.org/
- **Yaci Indexer**: https://github.com/manifest-network/yaci
- **ECharts**: https://echarts.apache.org/en/index.html

### Repository Links

- **Main Repo**: https://github.com/Cordtus/yaci-explorer
- **Yaci Indexer**: https://github.com/manifest-network/yaci
- **Issues**: https://github.com/Cordtus/yaci-explorer/issues

### Contact & Support

- Open GitHub issues for bugs/features
- Check existing issues before creating new ones
- Include steps to reproduce for bugs
- Provide chain ID and version for deployment issues

---

**Document Version**: 1.0
**Last Updated**: 2025-11-15
**Maintained By**: Yaci Explorer Team
