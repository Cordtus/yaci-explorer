# PostgREST API Documentation

This document describes the PostgREST API layer for the Yaci blockchain indexer and how the frontend should consume it efficiently.

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  PostgREST  │────▶│  PostgreSQL │
│   (React)   │◀────│   (REST)    │◀────│  (Database) │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Design Principle**: Keep the frontend lightweight by pushing aggregation and complex queries to the database layer.

## Database Schema

### Core Tables

| Table | Description | Primary Key |
|-------|-------------|-------------|
| `blocks_raw` | Raw block data from chain | `id` (height) |
| `transactions_main` | Processed transaction data | `id` (hash) |
| `transactions_raw` | Raw transaction data | `id` (hash) |
| `messages_main` | Extracted messages from transactions | `id, message_index` |
| `events_main` | Events emitted by transactions | `id, event_index, attr_index` |

### Table Schemas

#### blocks_raw
```sql
id        INTEGER PRIMARY KEY  -- block height
data      JSONB                -- full block data from chain
```

#### transactions_main
```sql
id        TEXT PRIMARY KEY     -- transaction hash
height    INTEGER              -- block height
timestamp TIMESTAMPTZ          -- block timestamp
fee       JSONB                -- { gasLimit, amount: [{ denom, amount }] }
gas_used  INTEGER              -- actual gas consumed
error     TEXT                 -- error message if failed, null if success
```

#### messages_main
```sql
id            TEXT             -- transaction hash
message_index INTEGER          -- message position in tx
type          TEXT             -- message type (e.g., '/cosmos.bank.v1beta1.MsgSend')
sender        TEXT             -- message sender address
mentions      TEXT[]           -- array of addresses mentioned
metadata      JSONB            -- additional message data
```

#### events_main
```sql
id          TEXT               -- transaction hash
event_index INTEGER            -- event position
attr_index  INTEGER            -- attribute position within event
event_type  TEXT               -- event type
attr_key    TEXT               -- attribute key
attr_value  TEXT               -- attribute value
msg_index   INTEGER            -- associated message index
```

## PostgREST Query Patterns

### Basic Queries

```typescript
// Get paginated results with total count
const response = await fetch(`${baseUrl}/transactions_main?limit=20&offset=0&order=height.desc`, {
  headers: { 'Prefer': 'count=exact' }
})
const total = response.headers.get('Content-Range')?.split('/')[1]

// Filter by field
/transactions_main?error=is.null           // successful only
/transactions_main?height=eq.12345         // specific block
/transactions_main?timestamp=gte.2024-01-01 // after date

// Multiple conditions
/transactions_main?height=gte.100&height=lte.200

// OR conditions
/messages_main?or=(sender.eq.addr1,mentions.cs.{addr1})
```

### Array Contains (for mentions)
```typescript
// Find transactions mentioning an address
// cs = contains, use URL-encoded braces: %7B = {, %7D = }
/messages_main?mentions.cs.%7Baddress%7D
```

### Select Specific Fields
```typescript
// Only return needed fields (reduces payload)
/transactions_main?select=id,height,timestamp,fee
```

### Ordering
```typescript
/blocks_raw?order=id.desc              // newest first
/transactions_main?order=height.desc,id.asc  // multi-column
```

## Recommended Database Views

To minimize frontend complexity and improve performance, create these PostgreSQL views:

### 1. Transaction Volume by Day
```sql
CREATE VIEW api.tx_volume_daily AS
SELECT
  DATE(timestamp) as date,
  COUNT(*) as count
FROM api.transactions_main
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

**Frontend usage:**
```typescript
const data = await fetch(`${baseUrl}/tx_volume_daily`)
// Returns: [{ date: '2024-01-15', count: 1234 }, ...]
```

### 2. Transaction Volume by Hour
```sql
CREATE VIEW api.tx_volume_hourly AS
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as count
FROM api.transactions_main
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;
```

### 3. Message Type Distribution
```sql
CREATE VIEW api.message_type_stats AS
SELECT
  type,
  COUNT(*) as count
FROM api.messages_main
WHERE type IS NOT NULL
GROUP BY type
ORDER BY count DESC
LIMIT 20;
```

### 4. Chain Statistics
```sql
CREATE VIEW api.chain_stats AS
SELECT
  (SELECT MAX(id) FROM api.blocks_raw) as latest_block,
  (SELECT COUNT(*) FROM api.transactions_main) as total_transactions,
  (SELECT COUNT(*) FROM api.transactions_main WHERE error IS NOT NULL) as failed_transactions,
  (SELECT COUNT(DISTINCT sender) FROM api.messages_main WHERE sender IS NOT NULL) as unique_addresses;
```

### 5. Fee Revenue by Denomination
```sql
CREATE VIEW api.fee_revenue AS
SELECT
  coin->>'denom' as denom,
  SUM((coin->>'amount')::numeric) as total_amount
FROM api.transactions_main,
     jsonb_array_elements(fee->'amount') as coin
GROUP BY coin->>'denom'
ORDER BY total_amount DESC;
```

### 6. Transaction Stats by Time Window
```sql
CREATE OR REPLACE FUNCTION api.tx_stats_in_window(
  window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(
  tx_count BIGINT,
  avg_gas_used NUMERIC,
  success_rate NUMERIC
) AS $$
SELECT
  COUNT(*),
  AVG(gas_used),
  COUNT(*) FILTER (WHERE error IS NULL)::numeric / NULLIF(COUNT(*), 0) * 100
FROM api.transactions_main
WHERE timestamp >= NOW() - (window_minutes || ' minutes')::interval;
$$ LANGUAGE SQL STABLE;
```

**Frontend usage:**
```typescript
// Get stats for last hour
const data = await fetch(`${baseUrl}/rpc/tx_stats_in_window?window_minutes=60`)
```

### 7. Block Time Analysis
```sql
CREATE VIEW api.block_time_stats AS
WITH block_times AS (
  SELECT
    id,
    EXTRACT(EPOCH FROM (
      (data->'block'->'header'->>'time')::timestamptz -
      LAG((data->'block'->'header'->>'time')::timestamptz) OVER (ORDER BY id)
    )) as block_time
  FROM api.blocks_raw
  ORDER BY id DESC
  LIMIT 100
)
SELECT
  AVG(block_time) as avg_block_time,
  MIN(block_time) as min_block_time,
  MAX(block_time) as max_block_time
FROM block_times
WHERE block_time > 0 AND block_time < 100;
```

## Frontend Integration Patterns

### 1. Use the Client Library
```typescript
import { YaciAPIClient } from '@yaci/database-client'

const client = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

// Basic queries
const blocks = await client.getBlocks(20, 0)
const tx = await client.getTransaction(hash)
```

### 2. Direct PostgREST for Custom Queries
```typescript
// When you need custom aggregation not in the client
const baseUrl = client.getBaseUrl()

// Use database views (preferred - pre-aggregated)
const stats = await fetch(`${baseUrl}/chain_stats`)
const volume = await fetch(`${baseUrl}/tx_volume_daily`)

// Custom filters
const recentFailed = await fetch(
  `${baseUrl}/transactions_main?error=not.is.null&order=height.desc&limit=10`
)
```

### 3. Time-Based Queries with TimeRange
```typescript
import { getTransactionsInTimeRange, type TimeRange } from '@/lib/metrics'

// Flexible time ranges
const range: TimeRange = { value: 5, unit: 'minutes' }
const count = await getTransactionsInTimeRange(range)
```

### 4. Caching Strategy

The client includes built-in caching:
```typescript
const client = new YaciAPIClient(baseUrl, {
  cacheTimeout: 10000 // 10 seconds
})
```

For frontend components, use React Query:
```typescript
const { data } = useQuery({
  queryKey: ['blocks', page],
  queryFn: () => client.getBlocks(20, page * 20),
  staleTime: 5000,
  refetchInterval: 2000
})
```

## Performance Guidelines

### Do's
- ✅ Use database views for aggregations
- ✅ Use `select=field1,field2` to limit payload
- ✅ Use `Prefer: count=exact` only when needed
- ✅ Set appropriate `limit` values
- ✅ Use indexes on frequently filtered columns

### Don'ts
- ❌ Fetch large datasets and aggregate in JS
- ❌ Make N+1 queries (fetch list, then fetch each item)
- ❌ Request full objects when you need 2 fields
- ❌ Poll without cache/stale time management

## Migration Path

### Phase 1: Current State
Client fetches raw data and aggregates in JavaScript.

### Phase 2: Add Database Views
Create views for common aggregations (listed above).

### Phase 3: Update Client
Replace client-side aggregation with view queries:

```typescript
// Before (client-side aggregation)
async getTransactionVolumeOverTime(days = 7) {
  const transactions = await fetch(...)
  // ... JavaScript grouping logic
}

// After (database view)
async getTransactionVolumeOverTime(days = 7) {
  return fetch(`${this.baseUrl}/tx_volume_daily?date=gte.${startDate}`)
}
```

### Phase 4: Simplify Client
Remove aggregation methods, expose direct view access:

```typescript
const client = new YaciAPIClient(baseUrl)

// Direct view access
const volume = await client.query('tx_volume_daily')
const stats = await client.query('chain_stats')
```

## API Reference

### Endpoints (Tables)
- `GET /blocks_raw` - Block data
- `GET /transactions_main` - Transaction data
- `GET /transactions_raw` - Raw transaction data
- `GET /messages_main` - Message data
- `GET /events_main` - Event data

### Endpoints (Views) - After Migration
- `GET /chain_stats` - Overall chain statistics
- `GET /tx_volume_daily` - Daily transaction counts
- `GET /tx_volume_hourly` - Hourly transaction counts
- `GET /message_type_stats` - Message type distribution
- `GET /fee_revenue` - Fee revenue by denomination
- `GET /block_time_stats` - Block time statistics

### RPC Functions - After Migration
- `POST /rpc/tx_stats_in_window` - Stats for time window

## Environment Variables

```env
VITE_POSTGREST_URL=http://localhost:3000    # PostgREST API URL
VITE_CHAIN_REST_ENDPOINT=http://localhost:1317  # Chain REST API (optional)
```
