# YACI Explorer Stack Operations Guide

This document provides comprehensive coverage of the YACI Explorer three-component blockchain indexing and exploration system.

## System Architecture Overview

### Component Purpose and Interaction

The YACI Explorer stack consists of three specialized components working in concert to provide blockchain data indexing, processing, and visualization:

**1. Yaci Indexer** (github.com/Cordtus/yaci)
- Go-based blockchain data extraction engine
- Connects directly to Cosmos SDK chain gRPC endpoints
- Continuously polls for new blocks and transactions
- Stores raw blockchain data as JSON in PostgreSQL
- Handles resume logic via `SELECT COALESCE(MAX(id), 0) FROM api.blocks_raw`
- Configurable concurrency and retry mechanisms
- DO NOT MODIFY - external dependency maintained separately

**2. Middleware Layer** (github.com/Cordtus/yaci-explorer-apis)
- Dual-process architecture: PostgREST API server + Node.js worker
- PostgREST automatically generates REST API from PostgreSQL schema
- SQL functions provide complex business logic (pagination, filtering, aggregation)
- SQL views materialize analytics data (transaction volume, gas usage, message types)
- Database triggers parse raw JSON into structured relational tables
- EVM decode worker continuously monitors and decodes Ethereum-compatible transactions
- TypeScript client package for type-safe API consumption
- All business logic lives here - never in frontend or indexer

**3. Frontend Application** (github.com/Cordtus/yaci-explorer)
- React Router 7 client-only application (SSR disabled)
- TanStack Query manages server state with intelligent caching
- Radix UI components with Tailwind CSS styling
- Consumes middleware via typed API client
- Supports both Cosmos-native and EVM transaction visualization
- IBC denomination resolution with local caching

### Data Flow Pipeline

```
Cosmos SDK Chain (gRPC)
    |
    v
Yaci Indexer
    |
    v (INSERT operations)
PostgreSQL api.transactions_raw
    |
    v (Database triggers fire automatically)
PostgreSQL api.transactions_main/messages_main/events_main
    |
    +---> PostgREST API (HTTP REST) ---> Frontend (User Interface)
    |
    +---> EVM Worker (Background processing)
            |
            v
        api.evm_transactions/evm_logs/evm_token_transfers
```

**Detailed Flow:**

1. Yaci polls chain gRPC endpoint at configured intervals
2. Extracts block and transaction data with full nested message support
3. Inserts raw JSON into transactions_raw and blocks_raw tables
4. PostgreSQL triggers immediately fire on INSERT:
   - update_transaction_main: Parses transaction metadata
   - update_events_raw: Extracts events array
   - update_message_main: Parses messages with address extraction
   - update_event_main: Normalizes event attributes
5. PostgREST exposes structured data via auto-generated REST endpoints
6. EVM worker polls evm_pending_decode view every 5 seconds:
   - Identifies MsgEthereumTx messages not yet decoded
   - RLP decodes transaction data
   - Protobuf decodes response data
   - Lookups function signatures from 4byte.directory
   - Stores in evm_transactions, evm_logs, evm_token_transfers
7. Frontend queries PostgREST endpoints with TanStack Query
8. TanStack Query provides automatic caching (10s stale time, 5min garbage collection)

## Configuration Reference

### Environment Variables by Component

#### Yaci Indexer Configuration

```bash
# Required
YACI_GRPC_ENDPOINT=rpc.example.com:9090
YACI_POSTGRES_DSN=postgres://yaci_writer:password@host:5432/postgres

# Optional
YACI_START=1                    # Override start height (default: resume from MAX(id))
YACI_CONCURRENCY=5             # Concurrent gRPC requests (default: 5)
YACI_BLOCK_TIME=2s             # Polling interval (default: 2s)
YACI_MAX_RETRIES=3             # Connection retry attempts (default: 3)
YACI_INSECURE=false            # Disable TLS (default: false)
YACI_LOGLEVEL=info             # Log level (default: info)
YACI_MAX_RECV_MSG_SIZE=4194304 # Max gRPC message size in bytes (default: 4MB)
```

#### Middleware Configuration

**PostgREST Process:**
```bash
PGRST_DB_URI=postgres://authenticator:password@host:5432/postgres
PGRST_DB_ANON_ROLE=web_anon
PGRST_DB_SCHEMAS=api
PGRST_SERVER_PORT=3000
```

**EVM Worker Process:**
```bash
DATABASE_URL=postgres://postgres:password@host:5432/postgres
POLL_INTERVAL_MS=5000          # Worker polling frequency (default: 5000ms)
BATCH_SIZE=100                 # Transactions per batch (default: 100)
```

#### Frontend Configuration

```bash
VITE_POSTGREST_URL=https://yaci-explorer-apis.fly.dev
VITE_CHAIN_REST_ENDPOINT=https://rest.example.com  # For IBC denom resolution
```

### Database Schema Architecture

**Raw Storage Tables (written by Yaci):**
- `api.blocks_raw`: Block data with full header, transactions, last_commit
- `api.transactions_raw`: Transaction data with tx body, auth info, response
- `api.messages_raw`: Flattened messages (populated by trigger)
- `api.events_raw`: Flattened events (populated by trigger)

**Parsed Tables (populated by triggers):**
- `api.transactions_main`: Height, timestamp, fee, memo, error, proposal_ids
- `api.messages_main`: Type, sender, mentions array, metadata
- `api.events_main`: Normalized key-value event attributes

**EVM Tables (populated by worker):**
- `api.evm_transactions`: Decoded EVM tx fields (from, to, value, data, gas)
- `api.evm_logs`: Event logs with topics and data
- `api.evm_token_transfers`: Parsed ERC-20/721 transfers
- `api.evm_tokens`: Token metadata cache

**Analytics Views:**
- `api.tx_volume_daily/hourly`: Transaction counts aggregated by time
- `api.message_type_stats`: Message type distribution
- `api.gas_usage_distribution`: Gas usage buckets
- `api.fee_revenue`: Fee collection over time
- `api.evm_pending_decode`: View of EVM transactions awaiting decode

### Security Model

**PostgreSQL Roles:**

1. **postgres** (superuser)
   - Full database access
   - Used only for migrations and maintenance
   - Never exposed to applications

2. **yaci_writer** (indexer role)
   - INSERT permission on raw tables only
   - No access to parsed tables or views
   - Used by Yaci indexer

3. **authenticator** (PostgREST connection)
   - LOGIN permission
   - Can switch to web_anon role
   - Used by PostgREST for connection pooling

4. **web_anon** (public API role)
   - SELECT on all main tables and views
   - EXECUTE on API functions only
   - No INSERT, UPDATE, DELETE, TRUNCATE permissions
   - Enforces read-only API access

**Permission Grants:**
```sql
GRANT SELECT ON api.transactions_main TO web_anon;
GRANT SELECT ON api.messages_main TO web_anon;
GRANT SELECT ON api.events_main TO web_anon;
GRANT EXECUTE ON FUNCTION api.get_messages_for_address(TEXT) TO web_anon;
```

## Deployment Procedures

### Initial Deployment from Scratch

**Prerequisites:**
- Fly.io CLI installed and authenticated
- GitHub repository access
- Access to target blockchain gRPC endpoint

**Step 1: Deploy PostgreSQL Database**

```bash
# Create managed PostgreSQL instance
fly postgres create republic-yaci-pg \
  --region sjc \
  --vm-size shared-cpu-1x \
  --volume-size 10

# Save connection string output
# postgres://postgres:PASSWORD@republic-yaci-pg.flycast:5432

# Verify connectivity
fly postgres connect -a republic-yaci-pg
```

**Step 2: Apply Database Migrations**

```bash
cd ~/repos/yaci-explorer-apis

# Apply all migrations in order
cat migrations/001_complete_schema.sql | fly postgres connect -a republic-yaci-pg
cat migrations/002_add_yaci_triggers.sql | fly postgres connect -a republic-yaci-pg
cat migrations/003_fix_proposal_ids_type.sql | fly postgres connect -a republic-yaci-pg

# Verify schema
fly postgres connect -a republic-yaci-pg -c "\dt api.*"
fly postgres connect -a republic-yaci-pg -c "SELECT COUNT(*) FROM pg_trigger WHERE tgrelid = 'api.transactions_raw'::regclass;"
```

**Step 3: Deploy Middleware**

```bash
cd ~/repos/yaci-explorer-apis

# Create app (if not exists)
fly apps create yaci-explorer-apis --org personal

# Set secrets
fly secrets set \
  DATABASE_URL="postgres://postgres:PASSWORD@republic-yaci-pg.flycast:5432/postgres?sslmode=disable" \
  -a yaci-explorer-apis

fly secrets set \
  PGRST_DB_URI="postgres://authenticator:PASSWORD@republic-yaci-pg.flycast:5432/postgres" \
  -a yaci-explorer-apis

# Deploy with fly.toml configuration
fly deploy -a yaci-explorer-apis

# Verify both processes started
fly status -a yaci-explorer-apis
# Should show: 1 app process + 1 worker process

# Test API
curl https://yaci-explorer-apis.fly.dev/
```

**Step 4: Deploy Indexer**

```bash
cd ~/repos/yaci

# Create app (if not exists)
fly apps create republic-yaci-indexer --org personal

# Set secrets
fly secrets set \
  YACI_POSTGRES_DSN="postgres://yaci_writer:PASSWORD@republic-yaci-pg.flycast:5432/postgres" \
  YACI_GRPC_ENDPOINT="rpc.example.com:9090" \
  -a republic-yaci-indexer

# Deploy
fly deploy -a republic-yaci-indexer

# Monitor logs for progress
fly logs -a republic-yaci-indexer
```

**Step 5: Deploy Frontend**

```bash
cd ~/repos/yaci-explorer

# Ensure .env or build-time vars are set
echo "VITE_POSTGREST_URL=https://yaci-explorer-apis.fly.dev" > .env.production

# Create app (if not exists)
fly apps create yaci-explorer --org personal

# Deploy
fly deploy -a yaci-explorer

# Verify
curl https://yaci-explorer.fly.dev
```

### Updating Deployed Components

**Middleware Updates:**
```bash
cd ~/repos/yaci-explorer-apis
git pull origin main
fly deploy -a yaci-explorer-apis
```

**Frontend Updates:**
```bash
cd ~/repos/yaci-explorer
git pull origin main
fly deploy -a yaci-explorer
```

**Database Migrations:**
```bash
# Always test in development first
cat migrations/004_new_migration.sql | fly postgres connect -a republic-yaci-pg
```

**Indexer Updates (use with caution):**
```bash
cd ~/repos/yaci
git pull origin main
fly deploy -a republic-yaci-indexer
```

### Rollback Procedures

**Middleware Rollback:**
```bash
# List recent releases
fly releases -a yaci-explorer-apis

# Rollback to previous version
fly releases rollback <version> -a yaci-explorer-apis
```

**Database Rollback:**
```bash
# Restore from backup
fly postgres connect -a republic-yaci-pg < backup.sql

# Or use Fly backup restore
fly postgres backup restore <backup-id> -a republic-yaci-pg
```

## Operations Manual

### Starting and Stopping Components

**Check Current Status:**
```bash
fly status -a republic-yaci-indexer
fly status -a yaci-explorer-apis
fly status -a yaci-explorer
```

**Stop Indexer (for maintenance):**
```bash
# List machines
fly machines list -a republic-yaci-indexer

# Stop specific machine
fly machine stop <machine-id> -a republic-yaci-indexer
```

**Start Indexer:**
```bash
fly machine start <machine-id> -a republic-yaci-indexer
```

**Restart Middleware:**
```bash
# Restart all machines
fly machine restart <machine-id> -a yaci-explorer-apis

# Or redeploy (cleaner)
cd ~/repos/yaci-explorer-apis
fly deploy -a yaci-explorer-apis
```

**Scale Middleware:**
```bash
# Scale app processes
fly scale count 2 --process-group=app -a yaci-explorer-apis

# Scale worker processes
fly scale count 2 --process-group=worker -a yaci-explorer-apis
```

### Monitoring and Observability

**Key Performance Indicators:**

1. **Indexer Progress**
   - Current indexed block vs chain tip
   - Blocks per second ingestion rate
   - Transaction throughput

2. **Database Health**
   - Row counts in main tables
   - Trigger execution success rate
   - Query response times

3. **Worker Performance**
   - EVM transactions decoded per minute
   - Pending decode queue size
   - Error rate

4. **API Health**
   - HTTP response times
   - Error rate (4xx/5xx)
   - Request volume

**Monitoring Commands:**

```bash
# Check indexer progress
fly postgres connect -a republic-yaci-pg -c "
SELECT
  MAX(id) as latest_block,
  COUNT(*) as total_blocks,
  MAX(data->>'time') as latest_block_time
FROM api.blocks_raw;
"

# Check parsed data status
fly postgres connect -a republic-yaci-pg -c "
SELECT
  (SELECT COUNT(*) FROM api.transactions_raw) as raw_txs,
  (SELECT COUNT(*) FROM api.transactions_main) as parsed_txs,
  (SELECT COUNT(*) FROM api.messages_main) as messages,
  (SELECT COUNT(*) FROM api.events_main) as events;
"

# Check EVM decode status
fly postgres connect -a republic-yaci-pg -c "
SELECT
  (SELECT COUNT(*) FROM api.evm_pending_decode) as pending,
  (SELECT COUNT(*) FROM api.evm_transactions) as decoded;
"

# Check worker logs
fly logs -a yaci-explorer-apis --instance=<worker-id>

# Check API health
curl -i https://yaci-explorer-apis.fly.dev/

# Monitor API logs
fly logs -a yaci-explorer-apis --instance=<app-id>

# Check database connections
fly postgres connect -a republic-yaci-pg -c "
SELECT
  datname,
  usename,
  application_name,
  state,
  query_start
FROM pg_stat_activity
WHERE datname = 'postgres';
"
```

**Setting Up Alerts:**

```bash
# Monitor via fly-log-shipper to external service
fly extensions list
fly extensions create fly-log-shipper

# Or use built-in metrics
fly dashboard -a yaci-explorer-apis
```

### Maintenance Tasks

**Daily:**
- Monitor indexer block height (should track chain tip within seconds)
- Check API health endpoint response
- Review error logs for anomalies

**Weekly:**
```bash
# Vacuum and analyze database
fly postgres connect -a republic-yaci-pg -c "VACUUM ANALYZE;"

# Check table sizes
fly postgres connect -a republic-yaci-pg -c "
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'api'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Check slow queries
fly postgres connect -a republic-yaci-pg -c "
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"
```

**Monthly:**
```bash
# Backup database
fly postgres backup create -a republic-yaci-pg

# Review backup retention
fly postgres backup list -a republic-yaci-pg

# Check index health
fly postgres connect -a republic-yaci-pg -c "
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'api'
ORDER BY idx_scan;
"
```

### Handling Genesis Resets (Devnet)

When a development network resets from block 1:

```bash
# Step 1: Stop indexer immediately
fly machine stop <indexer-id> -a republic-yaci-indexer

# Step 2: Truncate all data tables
fly postgres connect -a republic-yaci-pg -c "
BEGIN;
TRUNCATE api.blocks_raw CASCADE;
TRUNCATE api.transactions_raw CASCADE;
TRUNCATE api.evm_transactions CASCADE;
TRUNCATE api.evm_logs CASCADE;
TRUNCATE api.evm_token_transfers CASCADE;
TRUNCATE api.evm_tokens CASCADE;
COMMIT;
"

# Step 3: Verify clean state
fly postgres connect -a republic-yaci-pg -c "
SELECT
  (SELECT COUNT(*) FROM api.blocks_raw) as blocks,
  (SELECT COUNT(*) FROM api.transactions_raw) as txs;
"

# Step 4: Start indexer (will automatically resume from block 1)
fly machine start <indexer-id> -a republic-yaci-indexer

# Step 5: Monitor restart
fly logs -a republic-yaci-indexer
```

### Trigger Backfill Process

If database triggers are added after data already exists:

```bash
cd ~/repos/yaci-explorer-apis

# Start proxy to database
fly proxy 15433:5432 -a republic-yaci-pg &

# Run backfill script
export DATABASE_URL="postgres://postgres:PASSWORD@localhost:15433/postgres?sslmode=disable"
npx tsx scripts/backfill-triggers.ts

# Monitor progress (shows batch processing)
# Script will output:
# Total transactions in transactions_raw: N
# Already parsed in transactions_main: M
# Remaining to parse: N-M
# Processing batch starting at offset 0...
# ...
# Backfill complete! Processed N transactions.
```

## Troubleshooting Guide

### Empty Transactions Page

**Symptom:** Frontend shows no transactions despite indexer running

**Diagnosis:**
```bash
# Check if indexer is writing data
fly postgres connect -a republic-yaci-pg -c "SELECT COUNT(*) FROM api.transactions_raw;"

# Check if triggers are parsing data
fly postgres connect -a republic-yaci-pg -c "SELECT COUNT(*) FROM api.transactions_main;"

# If raw has data but main is empty, check triggers exist
fly postgres connect -a republic-yaci-pg -c "
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid::regclass::text LIKE 'api.%'
ORDER BY tgrelid::regclass, tgname;
"
```

**Resolution:**
```bash
# If triggers missing, apply migration
cat migrations/002_add_yaci_triggers.sql | fly postgres connect -a republic-yaci-pg

# Backfill existing data
npx tsx scripts/backfill-triggers.ts
```

### Indexer Stalled at Block Height

**Symptom:** Indexer logs show same block height repeatedly

**Diagnosis:**
```bash
# Check last indexed block
fly postgres connect -a republic-yaci-pg -c "SELECT MAX(id) FROM api.blocks_raw;"

# Check indexer logs for errors
fly logs -a republic-yaci-indexer | tail -100

# Test gRPC connectivity from indexer
fly ssh console -a republic-yaci-indexer
# Inside container:
grpcurl -plaintext YOUR_GRPC_ENDPOINT:9090 list
```

**Common Causes:**
1. Network connectivity to gRPC endpoint lost
2. Database connection pool exhausted
3. Disk space full on database
4. Chain gRPC endpoint rate limiting

**Resolution:**
```bash
# Restart indexer
fly machine restart <id> -a republic-yaci-indexer

# If database issue, check disk space
fly postgres connect -a republic-yaci-pg -c "SELECT pg_database_size('postgres');"

# Check connection pool
fly postgres connect -a republic-yaci-pg -c "SELECT count(*) FROM pg_stat_activity;"
```

### EVM Transactions Not Decoding

**Symptom:** EVM transactions visible but not decoded

**Diagnosis:**
```bash
# Check worker process status
fly status -a yaci-explorer-apis
# Look for worker process with state=started

# Check pending queue
fly postgres connect -a republic-yaci-pg -c "SELECT COUNT(*) FROM api.evm_pending_decode;"

# Check worker logs
fly logs -a yaci-explorer-apis | grep -i worker

# Check if EVM tables exist
fly postgres connect -a republic-yaci-pg -c "\dt api.evm_*"
```

**Common Causes:**
1. Worker process crashed
2. DATABASE_URL secret not set
3. Network connectivity to 4byte.directory
4. Malformed RLP data

**Resolution:**
```bash
# Restart worker process
fly machine restart <worker-id> -a yaci-explorer-apis

# Verify DATABASE_URL secret
fly secrets list -a yaci-explorer-apis

# Set if missing
fly secrets set DATABASE_URL="postgres://..." -a yaci-explorer-apis

# Check worker logs for specific errors
fly logs -a yaci-explorer-apis -i <worker-id>
```

### API Returning 500 Errors

**Symptom:** PostgREST returns internal server errors

**Diagnosis:**
```bash
# Check PostgREST logs
fly logs -a yaci-explorer-apis -i <app-id>

# Test database connectivity
fly postgres connect -a republic-yaci-pg -c "SELECT 1;"

# Check role permissions
fly postgres connect -a republic-yaci-pg -c "
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'web_anon' AND table_schema = 'api';
"
```

**Common Causes:**
1. Database connection string incorrect
2. web_anon role missing permissions
3. SQL function errors
4. Database schema out of sync

**Resolution:**
```bash
# Verify PGRST_DB_URI secret
fly secrets list -a yaci-explorer-apis

# Re-grant permissions
fly postgres connect -a republic-yaci-pg -c "
GRANT SELECT ON ALL TABLES IN SCHEMA api TO web_anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api TO web_anon;
"

# Restart PostgREST
fly machine restart <app-id> -a yaci-explorer-apis
```

### High Database CPU Usage

**Symptom:** Database performance degraded, queries slow

**Diagnosis:**
```bash
# Check active queries
fly postgres connect -a republic-yaci-pg -c "
SELECT
  pid,
  usename,
  application_name,
  state,
  query,
  query_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
"

# Check slow queries
fly postgres connect -a republic-yaci-pg -c "
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
"

# Check table bloat
fly postgres connect -a republic-yaci-pg -c "
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'api'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

**Resolution:**
```bash
# Vacuum tables
fly postgres connect -a republic-yaci-pg -c "VACUUM FULL ANALYZE api.transactions_raw;"

# Add missing indexes
fly postgres connect -a republic-yaci-pg -c "
CREATE INDEX CONCURRENTLY idx_tx_timestamp ON api.transactions_main(timestamp DESC);
"

# Scale database if needed
fly postgres update --vm-size shared-cpu-2x -a republic-yaci-pg
```

## Development Workflow

### Local Development Setup

```bash
# Clone all three repositories
git clone https://github.com/Cordtus/yaci.git
git clone https://github.com/Cordtus/yaci-explorer-apis.git
git clone https://github.com/Cordtus/yaci-explorer.git

# Start local PostgreSQL
docker run -d \
  --name yaci-postgres \
  -e POSTGRES_PASSWORD=foobar \
  -p 5432:5432 \
  postgres:16

# Apply migrations
cat yaci-explorer-apis/migrations/*.sql | psql postgres://postgres:foobar@localhost/postgres

# Run indexer locally
cd yaci
export YACI_POSTGRES_DSN="postgres://postgres:foobar@localhost/postgres"
export YACI_GRPC_ENDPOINT="testnet.example.com:9090"
go run main.go extract postgres

# Run middleware locally
cd yaci-explorer-apis
export PGRST_DB_URI="postgres://postgres:foobar@localhost/postgres"
export PGRST_DB_ANON_ROLE="web_anon"
postgrest &
export DATABASE_URL="postgres://postgres:foobar@localhost/postgres"
npx tsx scripts/decode-evm-daemon.ts &

# Run frontend locally
cd yaci-explorer
echo "VITE_POSTGREST_URL=http://localhost:3000" > .env.local
yarn dev
```

### Testing Changes

**Middleware Changes:**
```bash
cd yaci-explorer-apis

# Type check
yarn typecheck

# Test migration
cat migrations/00X_test.sql | psql $DATABASE_URL

# Test worker locally
export DATABASE_URL="..."
npx tsx scripts/decode-evm-daemon.ts
```

**Frontend Changes:**
```bash
cd yaci-explorer

# Type check
yarn typecheck

# Build test
yarn build

# Run tests (if implemented)
yarn test
```

### Creating New Migrations

```bash
cd yaci-explorer-apis

# Create new migration file
cat > migrations/004_new_feature.sql << 'EOF'
BEGIN;

-- Add new columns, tables, functions, etc.

COMMIT;
EOF

# Test locally first
cat migrations/004_new_feature.sql | psql $LOCAL_DATABASE_URL

# Create down migration
cat > migrations/004_new_feature.down.sql << 'EOF'
BEGIN;

-- Reverse all changes

COMMIT;
EOF

# Apply to production when ready
cat migrations/004_new_feature.sql | fly postgres connect -a republic-yaci-pg
```

## CI/CD Pipeline

### GitHub Actions Workflows

**Build Workflow** (.github/workflows/build.yml)
- Triggers: Pull requests to main, pushes to main
- Steps:
  1. Checkout code
  2. Setup Node.js 20 with yarn cache
  3. Install dependencies
  4. Type check with TypeScript
  5. Validate migration files (BEGIN/COMMIT checks)

**Deploy Workflow** (.github/workflows/deploy.yml)
- Triggers: Push to main, manual workflow_dispatch
- Steps:
  1. Checkout code
  2. Setup flyctl
  3. Deploy to Fly.io with FLY_API_TOKEN secret

### Branch Strategy

- **main**: Production deployments (auto-deploy on merge)
- **middleware-migration**: Active development branch
- **feature/*****: Feature branches (PR to main)

### Required Secrets

GitHub repository secrets:
- `FLY_API_TOKEN`: Fly.io API token for deployments

### Manual Deployment

```bash
# Deploy without CI/CD
cd yaci-explorer-apis
fly deploy --remote-only -a yaci-explorer-apis

cd yaci-explorer
fly deploy --remote-only -a yaci-explorer
```

## Advanced Topics

### Custom SQL Functions

Example function for complex queries:

```sql
CREATE OR REPLACE FUNCTION api.get_address_summary(_address TEXT)
RETURNS JSONB
LANGUAGE SQL STABLE
AS $$
  WITH tx_stats AS (
    SELECT
      COUNT(DISTINCT t.id) as total_txs,
      SUM((t.fee->'amount'->0->>'amount')::BIGINT) as total_fees,
      MIN(t.timestamp) as first_seen,
      MAX(t.timestamp) as last_seen
    FROM api.transactions_main t
    JOIN api.messages_main m ON t.id = m.id
    WHERE m.sender = _address OR m.mentions @> ARRAY[_address]
  )
  SELECT jsonb_build_object(
    'address', _address,
    'total_transactions', COALESCE(total_txs, 0),
    'total_fees_paid', COALESCE(total_fees, 0),
    'first_seen', first_seen,
    'last_seen', last_seen
  )
  FROM tx_stats;
$$;

GRANT EXECUTE ON FUNCTION api.get_address_summary(TEXT) TO web_anon;
```

### Performance Optimization

**Indexing Strategy:**
```sql
-- Add covering indexes for common queries
CREATE INDEX CONCURRENTLY idx_msg_sender_height
ON api.messages_main(sender, height DESC)
WHERE message_index < 10000;

-- Partial indexes for EVM transactions
CREATE INDEX CONCURRENTLY idx_evm_tx_hash
ON api.evm_transactions(hash)
WHERE status = 1;

-- GIN indexes for array searches
CREATE INDEX CONCURRENTLY idx_msg_mentions_gin
ON api.messages_main USING GIN(mentions);
```

**Query Optimization:**
```sql
-- Use CTEs for complex queries
WITH recent_blocks AS (
  SELECT id, data
  FROM api.blocks_raw
  WHERE id > (SELECT MAX(id) - 100 FROM api.blocks_raw)
)
SELECT ...;

-- Avoid N+1 queries
SELECT
  t.*,
  (SELECT jsonb_agg(m.*) FROM api.messages_main m WHERE m.id = t.id) as messages
FROM api.transactions_main t;
```

### Scaling Considerations

**Vertical Scaling:**
```bash
# Scale database
fly postgres update --vm-size dedicated-cpu-1x -a republic-yaci-pg

# Scale middleware
fly scale vm shared-cpu-2x -a yaci-explorer-apis
```

**Horizontal Scaling:**
```bash
# Add more API instances
fly scale count 3 --process-group=app -a yaci-explorer-apis

# Add read replicas (requires Fly Postgres HA)
fly postgres attach --app yaci-explorer-apis republic-yaci-pg
```

**Partitioning Strategy (future):**
```sql
-- Time-based partitioning for large tables
CREATE TABLE api.transactions_main_2024_01 PARTITION OF api.transactions_main
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## Appendix

### Useful SQL Queries

```sql
-- Find high-value transactions
SELECT id, height, (fee->'amount'->0->>'amount')::BIGINT as fee_amount
FROM api.transactions_main
ORDER BY fee_amount DESC NULLS LAST
LIMIT 100;

-- Message type distribution
SELECT type, COUNT(*) as count
FROM api.messages_main
WHERE message_index < 10000
GROUP BY type
ORDER BY count DESC;

-- Recent EVM transactions
SELECT
  et.hash,
  et."from",
  et."to",
  et.value::TEXT,
  t.timestamp
FROM api.evm_transactions et
JOIN api.transactions_main t ON et.tx_id = t.id
ORDER BY t.timestamp DESC
LIMIT 50;

-- Token transfer summary
SELECT
  token_address,
  COUNT(*) as transfer_count,
  COUNT(DISTINCT from_address) as unique_senders
FROM api.evm_token_transfers
GROUP BY token_address
ORDER BY transfer_count DESC;
```

### Common Fly.io Commands

```bash
# SSH into running machine
fly ssh console -a yaci-explorer-apis

# Execute command in container
fly ssh console -a yaci-explorer-apis -C "ls -la"

# Copy files from container
fly ssh sftp get /path/in/container /local/path -a yaci-explorer-apis

# View machine metrics
fly dashboard -a yaci-explorer-apis

# List all apps
fly apps list

# View app configuration
fly config show -a yaci-explorer-apis
```

### Environment-Specific Configurations

**Development:**
- Local PostgreSQL
- Local PostgREST
- Vite dev server with hot reload
- Mock data for testing

**Staging:**
- Fly.io staging apps (yaci-explorer-staging)
- Separate database (republic-yaci-pg-staging)
- Connected to testnet

**Production:**
- Fly.io production apps
- Production database with backups
- Connected to mainnet
- Auto-scaling enabled

This guide provides comprehensive coverage for operating the YACI Explorer stack. For component-specific details, refer to individual repository documentation. For issues not covered here, check GitHub issues or contact the development team.
