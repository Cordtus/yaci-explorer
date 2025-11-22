# @yaci/database-client

PostgreSQL/PostgREST client for Yaci blockchain indexer.

## Installation

```bash
npm install @yaci/database-client
```

## Usage

```typescript
import { YaciAPIClient } from '@yaci/database-client'

// Create client with PostgREST URL
const client = new YaciAPIClient('http://localhost:3000')

// Fetch blocks
const blocks = await client.getBlocks(20, 0)

// Fetch transactions
const txs = await client.getTransactions(20, 0, { status: 'success' })

// Get chain statistics
const stats = await client.getChainStats()

// Search
const results = await client.search('cosmos1...')
```

## API

### Constructor

```typescript
new YaciAPIClient(baseUrl: string, options?: { cacheTimeout?: number })
```

- `baseUrl` - PostgREST API base URL (required)
- `options.cacheTimeout` - Cache timeout in milliseconds (default: 10000)

### Methods

#### Blocks
- `getBlocks(limit, offset)` - Get paginated blocks
- `getBlock(height)` - Get block by height
- `getLatestBlock()` - Get most recent block

#### Transactions
- `getTransactions(limit, offset, filters)` - Get paginated transactions with optional filters
- `getTransaction(hash)` - Get transaction by hash
- `getTransactionsByAddress(address, limit, offset)` - Get transactions for an address

#### Analytics
- `getChainStats()` - Get chain statistics
- `getTransactionVolumeOverTime(days)` - Transaction volume by date
- `getTransactionTypeDistribution()` - Message type distribution
- `getBlockTimeAnalysis(limit)` - Block time statistics
- And more...

#### Search
- `search(query)` - Universal search for blocks, transactions, addresses

## Types

All TypeScript types are exported:

```typescript
import type {
  Block,
  Transaction,
  EnhancedTransaction,
  Message,
  Event,
  PaginatedResponse,
  ChainStats
} from '@yaci/database-client'
```

## Documentation

- [API.md](./API.md) - Complete PostgREST API documentation and frontend integration patterns
- [migrations/](./migrations/) - SQL migrations for database views and functions

## Database Views

For optimal performance, apply the analytics views to your PostgreSQL database:

```bash
psql -d your_database -f migrations/001_analytics_views.sql
```

This creates pre-aggregated views for:
- Daily/hourly transaction volume
- Message type distribution
- Chain statistics
- Fee revenue
- Block time analysis
- Gas usage distribution

See [API.md](./API.md) for detailed usage.

## License

MIT
