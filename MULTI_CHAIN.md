# Multi-Chain Deployment Guide

## Current Multi-Chain Compatibility

### ✅ What Works Automatically

**Yaci Indexer:**
- Uses gRPC server reflection to discover protobuf definitions dynamically
- No `.proto` files needed - adapts to any Cosmos SDK chain
- JSONB storage accommodates different data structures
- Handles missing fields gracefully
- Works with any Cosmos SDK version (v0.45+)

**Frontend:**
- Dynamic chain info detection from blockchain data
- Denomination handling via database lookup
- Message type filters populated from actual data
- No hardcoded chain assumptions in most components

**Database Schema:**
- Two-tier storage (raw JSON + parsed) handles schema variations
- Triggers parse data defensively
- JSONB allows flexible field access

### ⚠️ What Needs Attention

**Chain-Specific Features:**
- EVM support detection is automatic but could be made more explicit
- Some hardcoded denom mappings in `src/lib/denom.ts`
- Analytics components assume certain message types exist

**Configuration:**
- Chain metadata requires environment variables
- No built-in multi-chain selector
- Single database per deployment

**UI Components:**
- Some components may render poorly if expected data is missing
- Need defensive rendering for optional chain features

## Deployment Patterns

### Pattern 1: One Instance Per Chain (Recommended)

Deploy separate full stacks for each chain:

```
Chain A:
  - PostgreSQL (port 5432)
  - Yaci indexer → Chain A gRPC
  - PostgREST (port 3000)
  - Explorer UI (port 3001)

Chain B:
  - PostgreSQL (port 5433)
  - Yaci indexer → Chain B gRPC
  - PostgREST (port 3001)
  - Explorer UI (port 3002)
```

**Pros:**
- Complete isolation
- Independent scaling
- No cross-chain data concerns
- Simplest to maintain

**Cons:**
- Resource duplication
- More containers/services to manage

### Pattern 2: Shared Database with Chain Prefix

Single database with chain-prefixed schemas:

```
PostgreSQL:
  - mantra_api schema → Mantrachain data
  - juno_api schema → Juno data
  - osmosis_api schema → Osmosis data

Multiple Indexers:
  - Yaci (mantra) → mantra_api schema
  - Yaci (juno) → juno_api schema
  - Yaci (osmosis) → osmosis_api schema
```

**Pros:**
- Single database to manage
- Shared backup/maintenance

**Cons:**
- Requires schema migration modifications
- PostgREST needs multiple instances
- More complex configuration

### Pattern 3: Multi-Chain Frontend (Future)

Single UI with chain selector, multiple backends:

```
Frontend (port 3001):
  - Chain selector dropdown
  - API client switches based on selection

Backends:
  - Mantra API: mantra-api.domain.com
  - Juno API: juno-api.domain.com
  - Osmosis API: osmosis-api.domain.com
```

**Pros:**
- Single UI for users
- Easy chain comparison

**Cons:**
- Requires significant frontend changes
- State management complexity
- Not currently implemented

## Quick Deployment to Another Chain

### Step 1: Clone Configuration

```bash
# Copy existing deployment
cp -r yaci-explorer yaci-explorer-juno

# Update environment variables
cd yaci-explorer-juno
```

### Step 2: Update .env File

```bash
# Chain to index
CHAIN_GRPC_ENDPOINT=juno-node.example.com:9090
CHAIN_ID=juno-1
CHAIN_NAME=Juno Network

# Change ports to avoid conflicts (if on same host)
POSTGRES_PORT=5433
POSTGREST_PORT=3002
EXPLORER_PORT=3003
YACI_METRICS_PORT=2113

# Update API URL for frontend
VITE_POSTGREST_URL=http://localhost:3002
POSTGREST_URL=http://localhost:3002
```

### Step 3: Deploy

```bash
# Docker deployment
docker compose -f docker/docker-compose.yml up -d

# Or native LXC deployment
./scripts/deploy-native.sh
```

### Step 4: Verify

```bash
# Check indexer is syncing
docker logs -f yaci-indexer

# Check database has data
psql -U postgres -d yaci -c "SELECT COUNT(*) FROM api.blocks_raw;"

# Access frontend
curl http://localhost:3003
```

## Chain-Specific Customization

### Add Custom Denominations

Edit `src/lib/denom.ts`:

```typescript
const KNOWN_DENOMS: Record<string, { name: string; symbol: string; decimals: number }> = {
  // Add your chain's native denom
  uosmo: { name: 'Osmosis', symbol: 'OSMO', decimals: 6 },
  // ... existing denoms
}
```

### Add Chain to Registry

Create `src/config/chains.ts`:

```typescript
export const CHAIN_CONFIGS = {
  'manifest-1': {
    name: 'Manifest Network',
    features: {
      evm: true,
      ibc: true,
      wasm: false,
    },
    nativeDenom: 'umfx',
    rpcEndpoint: 'https://rpc.manifest.com',
    restEndpoint: 'https://api.manifest.com',
  },
  'juno-1': {
    name: 'Juno Network',
    features: {
      evm: false,
      ibc: true,
      wasm: true,
    },
    nativeDenom: 'ujuno',
    rpcEndpoint: 'https://rpc.juno.com',
    restEndpoint: 'https://api.juno.com',
  },
}
```

## Database Considerations

### Schema Compatibility

The database schema is designed to handle variations:

- **Raw tables** store complete JSON (any structure)
- **Main tables** extract common fields
- Triggers handle missing fields with NULL
- No foreign key constraints to external data

### Data That May Vary

**Block Structure:**
- `block.last_commit` vs `block.lastCommit` (camelCase variations)
- `block_id` vs `blockId`
- Proposer address encoding differences

**Transaction Structure:**
- `tx.body.messages` vs `tx.messages`
- Error format variations
- Fee structure differences

**Message Types:**
- Each chain has unique message types
- Custom modules create custom messages
- Frontend adapts automatically via `getDistinctMessageTypes()`

### Handling Missing Data

Triggers use safe navigation:

```sql
-- Example: multiple fallback paths for validator count
latestBlock?.data?.block?.last_commit?.signatures?.length ||
latestBlock?.data?.block?.lastCommit?.signatures?.length ||
latestBlock?.data?.lastCommit?.signatures?.length ||
0
```

## Known Chain Differences

### Cosmos Hub (cosmoshub-4)
- Standard Cosmos SDK modules
- No EVM, no CosmWasm
- Simple transaction structure

### Juno (juno-1)
- CosmWasm smart contracts
- Custom `MsgExecuteContract` messages
- Contract state in messages

### Osmosis (osmosis-1)
- Custom DEX modules
- Pool-related message types
- Concentrated liquidity messages

### Mantrachain (mantra-1)
- EVM module support
- Both Cosmos and EVM transactions
- `MsgEthereumTx` message type
- Hybrid account system

### Evmos (evmos_9001-2)
- Native EVM integration
- ERC20 module
- Ethereum JSON-RPC compatibility

## Testing Multi-Chain Compatibility

### Test Checklist

Before deploying to a new chain:

1. **Indexer Sync**
   - [ ] Connects to gRPC successfully
   - [ ] Indexes blocks without errors
   - [ ] Parses transactions correctly
   - [ ] Handles chain-specific messages

2. **Database**
   - [ ] Blocks appear in blocks_raw
   - [ ] Transactions populate transactions_main
   - [ ] Messages populate messages_main
   - [ ] Events populate events_main

3. **Frontend**
   - [ ] Blocks page loads
   - [ ] Transactions page loads
   - [ ] Transaction details render
   - [ ] Analytics page shows data
   - [ ] Filters work correctly
   - [ ] No console errors

4. **Chain-Specific**
   - [ ] Native denom displays correctly
   - [ ] IBC tokens resolve properly
   - [ ] Custom message types appear in filters
   - [ ] Chain-specific features work (EVM, WASM, etc.)

### Common Issues

**Issue:** Transaction parse errors
```
tx parse error: expected 2 wire type, got 0
```
**Solution:** This is expected for malformed/pruned data. Indexer skips and continues.

**Issue:** Missing denominations
**Solution:** Add to `KNOWN_DENOMS` or populate `denom_metadata` table.

**Issue:** Analytics showing zeros
**Solution:** Check field paths in analytics components, add fallbacks.

**Issue:** Filters not populating
**Solution:** Verify messages_main has data, check API connectivity.

## Recommendations for Production

### 1. Use Pattern 1 (One Instance Per Chain)
- Simplest and most reliable
- Easy to troubleshoot
- Independent scaling

### 2. Monitor Indexer Health
```bash
# Check indexer is running
systemctl status yaci

# Check sync status
curl http://localhost:2112/metrics | grep yaci_latest_height

# Check for errors
journalctl -u yaci -f | grep -i error
```

### 3. Database Maintenance
```bash
# Monitor database size
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('yaci'));"

# Vacuum regularly
psql -U postgres yaci -c "VACUUM ANALYZE;"

# Check for missing indexes
psql -U postgres yaci -c "SELECT * FROM pg_stat_user_tables WHERE seq_scan > idx_scan;"
```

### 4. Backup Strategy
```bash
# Backup database
pg_dump -U postgres yaci | gzip > yaci-backup-$(date +%Y%m%d).sql.gz

# Backup configuration
tar -czf config-backup.tar.gz .env docker/ scripts/
```

### 5. Performance Tuning

For high-throughput chains:

```bash
# Increase indexer concurrency
YACI_MAX_CONCURRENCY=200

# Tune PostgreSQL
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 128MB
maintenance_work_mem = 1GB
```

## Future Enhancements

### Planned Features

1. **Multi-chain frontend**
   - Chain selector in UI
   - Persist chain selection
   - Compare chains side-by-side

2. **Chain auto-detection**
   - Discover chain features automatically
   - Enable/disable UI features based on detection
   - No manual configuration needed

3. **Enhanced chain registry**
   - Integration with Cosmos chain registry
   - Automatic IBC denom resolution
   - Validator metadata

4. **Cross-chain analytics**
   - IBC transfer tracking
   - Multi-chain portfolio view
   - Cross-chain message flow visualization

## Getting Help

- **Indexer issues**: Check yaci logs and Prometheus metrics
- **Frontend issues**: Check browser console and API responses
- **Database issues**: Check PostgreSQL logs and table contents
- **Chain-specific issues**: Consult chain documentation for message format
