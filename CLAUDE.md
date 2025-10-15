# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

`yaci-explorer` is a modern block explorer for Cosmos SDK chains with native EVM support. Built with React Router 7, it provides a high-performance UI for exploring blockchain data indexed by the Yaci indexer.

## Code Documentation Standards

**IMPORTANT**: Always add TSDoc-style comments when building or working on any part of the project:

- **TypeScript/JavaScript**: Use JSDoc/TSDoc format with `@param`, `@returns`, `@throws`, `@example` tags
- **All exported functions/types**: Must have documentation comments
- **Complex logic**: Add inline comments explaining the "why" not the "what"
- **React components**: Document props with JSDoc
- **API functions**: Include usage examples in comments

Example:
```typescript
/**
 * Fetches block data from the PostgREST API
 * @param blockHeight - The height of the block to fetch
 * @returns Promise resolving to block data with transactions
 * @throws {Error} If the block is not found or network error occurs
 * @example
 * const block = await fetchBlock(12345);
 * console.log(block.data.header.height);
 */
export async function fetchBlock(blockHeight: number): Promise<Block> {
  // Implementation
}
```

## Architecture

### Stack Overview

- **Frontend**: React Router 7 with server-side rendering
- **UI Library**: Radix UI (via shadcn/ui) + Tailwind CSS
- **State Management**: TanStack Query for server state
- **API Layer**: PostgREST (auto-generated from PostgreSQL schema)
- **Data Source**: Yaci indexer (separate Docker container)
- **Build Tool**: Vite 7

### Data Flow

```
User Request
    ↓
React Router (SSR)
    ↓
TanStack Query (cache)
    ↓
PostgREST API Client
    ↓
PostgreSQL (indexed by Yaci)
```

## Development Commands

### Running the Application

```bash
# Development mode (with hot reload)
npm run dev                    # Port 5173

# Production build
npm run build                  # Outputs to build/

# Preview production build locally
npm run preview

# Full stack with Docker
docker compose -f docker/docker-compose.yml up -d
```

### Code Quality

```bash
# Type checking
npm run typecheck              # Generate types and check
npm run type-check             # Check only (no emit)

# Linting
npm run lint                   # Check for issues
npm run lint:fix               # Auto-fix issues

# Formatting
npm run format                 # Format all files
npm run format:check           # Check formatting only

# Cleanup
npm run clean                  # Remove build artifacts
npm run clean:all              # Remove build + node_modules
npm run reinstall              # Clean and reinstall dependencies
```

## Project Structure

```
src/
├── routes/                    # React Router pages (file-based routing)
│   ├── home.tsx              # Dashboard (/)
│   ├── blocks.tsx            # Blocks list (/blocks)
│   ├── blocks.$id.tsx        # Block detail (/blocks/:id)
│   ├── transactions.tsx      # Transactions list (/transactions)
│   ├── transactions.$hash.tsx # Transaction detail (/transactions/:hash)
│   └── analytics.tsx         # Analytics dashboard (/analytics)
├── components/
│   ├── ui/                   # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   └── ...               # Other Radix UI components
│   ├── common/               # Shared components
│   │   ├── search-bar.tsx    # Universal search
│   │   └── DenomDisplay.tsx  # Token denomination display
│   ├── layout/               # Layout components
│   │   └── header.tsx        # Main navigation header
│   ├── analytics/            # Analytics components
│   │   ├── TransactionVolumeChart.tsx
│   │   ├── GasEfficiencyChart.tsx
│   │   └── NetworkMetricsCard.tsx
│   └── MessageDetails.tsx    # Transaction message renderer
├── lib/
│   ├── api/
│   │   ├── client.ts         # PostgREST API client
│   │   └── prometheus.ts     # Prometheus metrics client
│   ├── utils.ts              # Utility functions (cn, etc.)
│   └── chain-info.ts         # Chain metadata fetcher
├── types/
│   └── index.ts              # TypeScript type definitions
├── styles/
│   └── globals.css           # Global Tailwind CSS + theme vars
├── contexts/
│   └── DenomContext.tsx      # Token denomination context
├── config/
│   └── chains.ts             # Chain-specific configuration
├── root.tsx                  # Root component with providers
└── entry.client.tsx          # Client-side entry point
```

### Key Files

- **src/root.tsx**: Root layout with QueryClientProvider, DenomProvider, and global layout
- **src/lib/api/client.ts**: PostgREST API client with all data fetching functions
- **src/lib/api/prometheus.ts**: Prometheus metrics scraping and parsing
- **src/components/MessageDetails.tsx**: Complex component for rendering transaction messages
- **docker/docker-compose.yml**: Full stack orchestration (postgres, yaci, postgrest, explorer)
- **vite.config.ts**: Vite configuration with React Router plugin
- **react-router.config.ts**: React Router 7 configuration

## API Integration

### PostgREST Client

The explorer communicates with PostgreSQL via PostgREST. Key patterns:

```typescript
// Fetching with filters
const blocks = await fetchBlocks({
  limit: 20,
  order: 'id.desc',
  offset: 0
});

// Fetching single item
const tx = await fetchTransaction(txHash);

// Using TanStack Query
const { data, isLoading } = useQuery({
  queryKey: ['block', blockHeight],
  queryFn: () => fetchBlock(blockHeight),
  staleTime: 10000,
});
```

### PostgREST Query Syntax

- **Filtering**: `?field=eq.value`, `?field=gt.100`
- **Ordering**: `?order=field.desc`
- **Pagination**: `?limit=20&offset=40`
- **Selection**: `?select=field1,field2`
- **Joins**: Automatic via foreign keys

## Common Development Tasks

### Adding a New Page

1. Create file in `src/routes/` following naming convention:
   - `about.tsx` → `/about`
   - `blocks.$id.tsx` → `/blocks/:id`
   - `posts._index.tsx` → `/posts` (index route)

2. Export default component and optional loader:
```typescript
import { type LoaderFunctionArgs } from 'react-router';

export async function loader({ params }: LoaderFunctionArgs) {
  // Server-side data loading
  return { data: await fetchData(params.id) };
}

export default function MyPage() {
  return <div>Page content</div>;
}
```

### Adding a New UI Component

1. Add to `src/components/ui/` if it's a base component
2. Or `src/components/` for feature components
3. Always add TSDoc comments:

```typescript
/**
 * Displays a transaction status badge with appropriate styling
 * @param status - Transaction status ('success' | 'failure' | 'pending')
 * @param className - Optional additional CSS classes
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Implementation
}
```

### Adding New API Endpoints

Update `src/lib/api/client.ts`:

```typescript
/**
 * Fetches validator information from the API
 * @param address - Validator operator address
 * @returns Promise resolving to validator data
 */
export async function fetchValidator(address: string): Promise<Validator> {
  const url = `${API_URL}/validators?address=eq.${address}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Validator not found');
  const data = await response.json();
  return data[0];
}
```

### Modifying Chain Configuration

Edit `src/config/chains.ts` to add/modify chain support:

```typescript
export const chains = {
  'manifest-1': {
    name: 'Manifest Network',
    features: {
      evm: true,    // Has EVM module
      ibc: true,    // Has IBC support
      wasm: true,   // Has CosmWasm support
    },
    denoms: {
      umfx: {
        display: 'MFX',
        decimals: 6,
      },
    },
  },
}
```

### Working with Docker Stack

```bash
# Start full stack (postgres + yaci + postgrest + explorer)
docker compose -f docker/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.yml logs -f explorer

# Restart just the explorer
docker compose -f docker/docker-compose.yml restart explorer

# Rebuild after code changes
docker compose -f docker/docker-compose.yml up -d --build explorer

# Stop all services
docker compose -f docker/docker-compose.yml down

# Stop and remove volumes (clears database)
docker compose -f docker/docker-compose.yml down -v
```

### Using Local Yaci Build

To develop with a local yaci indexer build:

1. Build yaci locally:
```bash
cd /path/to/yaci
docker build -t yaci:local -f docker/Dockerfile .
```

2. Update `.env`:
```bash
YACI_IMAGE=yaci:local
```

3. Restart stack:
```bash
docker compose -f docker/docker-compose.yml up -d
```

## Styling

### Tailwind CSS

- Uses Tailwind utility classes
- Custom theme defined in `tailwind.config.ts`
- CSS variables for theming in `src/styles/globals.css`
- Dark mode support via CSS variables

### Component Styling Pattern

```typescript
import { cn } from '@/lib/utils';

export function MyComponent({ className }: { className?: string }) {
  return (
    <div className={cn(
      "base classes here",
      "responsive: md:base lg:base",
      className  // Allow override
    )}>
      Content
    </div>
  );
}
```

### shadcn/ui Components

- Components in `src/components/ui/` are from shadcn/ui
- To add new shadcn components: Use the CLI or manually copy from shadcn/ui docs
- These are copies, not imports - customize freely

## Testing Approach

Currently no automated tests. When adding tests:

- Use Vitest for unit tests
- Use React Testing Library for component tests
- Use Playwright for E2E tests
- Mock PostgREST API responses

## Environment Variables

Key environment variables (set in `.env` or docker-compose):

- `VITE_POSTGREST_URL`: PostgREST API endpoint for frontend (build-time, default: http://localhost:3000)
- `POSTGREST_URL`: PostgREST API endpoint for docker-compose (default: http://localhost:3000)
- `CHAIN_ID`: Chain identifier for display (default: manifest-1)
- `CHAIN_NAME`: Human-readable chain name (default: Manifest Network)

In code, access via `import.meta.env.VITE_*` for client-side env vars.

## Performance Considerations

- **TanStack Query caching**: Default staleTime is 10s, gcTime is 5min
- **Server-side rendering**: Initial page load is server-rendered
- **Code splitting**: React Router handles automatic code splitting
- **Image optimization**: Use modern formats (WebP, AVIF)
- **Virtual scrolling**: For large lists (blocks, transactions)

## Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Set `CHAIN_GRPC_ENDPOINT` to production chain
- [ ] Configure proper `YACI_IMAGE` version (not `latest`)
- [ ] Enable HTTPS for PostgREST (reverse proxy recommended)
- [ ] Set up PostgreSQL backups
- [ ] Configure log retention
- [ ] Set up monitoring (Prometheus metrics on port 2112)
- [ ] Review security headers in `nginx.conf`

## Related Repositories

- **Yaci Indexer**: https://github.com/manifest-network/yaci - The data indexing engine
- **Cosmos SDK**: https://github.com/cosmos/cosmos-sdk - Blockchain framework
- **PostgREST**: https://postgrest.org/ - REST API generator

## Support

For issues specific to the explorer UI, open an issue in this repository. For indexing issues or data problems, see the [Yaci repository](https://github.com/manifest-network/yaci).
