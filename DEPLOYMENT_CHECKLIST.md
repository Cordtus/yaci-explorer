# EVM Feature Deployment Checklist

## Summary of Changes

This deployment adds complete EVM support with log decoding, token detection, and proper field naming.

### Middleware (yaci-explorer-apis)
- ✅ Single consolidated migration with EVM domain tables
- ✅ Enhanced decode worker extracts logs from protobuf
- ✅ Auto-detects ERC-20 tokens from Transfer events
- ✅ 4byte.directory function signature lookup

### Frontend (yaci-explorer)
- ✅ Updated types to use standard EVM field names
- ✅ EVMTransactionCard shows complete decoded data
- ✅ New EVMLogsCard component displays logs with topics
- ✅ EVM toggle works correctly

---

## Pre-Deployment

### 1. Backup Current Data (if needed)
```bash
fly postgres connect -a yaci-postgrest-db
\copy (SELECT * FROM api.evm_transactions) TO 'evm_backup.csv' CSV HEADER;
\q
```

### 2. Test Build
```bash
# Middleware
cd ~/repos/yaci-explorer-apis
yarn install
yarn typecheck

# Frontend
cd ~/repos/yaci-explorer
yarn install
yarn typecheck
yarn build
```

---

## Deployment Steps

### 1. Deploy Middleware Schema
```bash
cd ~/repos/yaci-explorer-apis
export DATABASE_URL="<your-db-url>"
./scripts/migrate.sh
```

Verify:
```sql
\dt api.evm_*
-- Should see: evm_transactions, evm_logs, evm_tokens, evm_token_transfers
```

### 2. Run Initial Decode
```bash
yarn decode:evm
```

Expected: Processes all pending EVM transactions

### 3. Deploy Frontend
```bash
cd ~/repos/yaci-explorer
fly deploy
```

---

## Testing Plan

### API Tests

1. **Get EVM transaction**
   ```bash
   curl "https://yaci-postgrest.fly.dev/rpc/get_transaction_detail?_hash=<evm_tx_hash>" | jq '.evm_data'
   ```
   Expected: Full EVM data with standard field names

2. **Check logs**
   ```bash
   curl "https://yaci-postgrest.fly.dev/rpc/get_transaction_detail?_hash=<evm_tx_hash>" | jq '.evm_logs'
   ```
   Expected: Array of logs with topics

3. **Search EVM hash**
   ```bash
   curl "https://yaci-postgrest.fly.dev/rpc/universal_search?_query=0x..." | jq
   ```
   Expected: Returns evm_transaction type

### Frontend Tests (Playwright)

**Test 1: Search Navigation**
- Search for EVM hash (0x...)
- Should navigate to /transactions/<cosmos_hash>?evm=true
- EVM toggle should be active

**Test 2: EVM View Display**
- Navigate to EVM transaction
- Click EVM toggle
- Verify EVMTransactionCard shows:
  - ✅ EVM hash
  - ✅ From/to addresses
  - ✅ Value in ETH
  - ✅ Gas used/limit
  - ✅ Gas price
  - ✅ Nonce
  - ✅ Transaction type
  - ✅ Function name (if decoded)

**Test 3: Logs Display**
- In EVM view
- Verify EVMLogsCard shows:
  - ✅ Log count badge
  - ✅ Contract addresses
  - ✅ Topics array
  - ✅ Data hex
  - ✅ Known event names (Transfer, Approval)

**Test 4: Token Transfer Detection**
- Find EVM tx with ERC-20 transfer
- Verify log shows "Transfer(address,address,uint256)"
- Check database:
  ```sql
  SELECT * FROM api.evm_tokens;
  SELECT * FROM api.evm_token_transfers WHERE tx_id = '...';
  ```

**Test 5: Function Decoding**
- Find EVM tx with contract call
- Verify function name from 4byte.directory
- Check EVMTransactionCard shows method signature

**Test 6: Copy Buttons**
- Test all copy buttons work:
  - EVM hash
  - From/to addresses
  - Log addresses
  - Topics
  - Data

---

## Rollback Plan

If issues occur:

### 1. Frontend Only Issue
```bash
cd ~/repos/yaci-explorer
git revert <commit>
fly deploy
```

### 2. Middleware Issue
```bash
# Revert migration
fly postgres connect -a yaci-postgrest-db
DROP TABLE api.evm_logs CASCADE;
DROP TABLE api.evm_tokens CASCADE;
DROP TABLE api.evm_token_transfers CASCADE;
-- Run old migration
```

### 3. Full Rollback
```bash
# Stop decode worker
sudo systemctl stop evm-decode.timer

# Restore backup
fly postgres connect -a yaci-postgrest-db
\copy api.evm_transactions FROM 'evm_backup.csv' CSV HEADER;
```

---

## Post-Deployment

### 1. Set Up Continuous Decoding

Choose one:

**Cron**:
```bash
crontab -e
*/5 * * * * cd ~/repos/yaci-explorer-apis && DATABASE_URL="..." yarn decode:evm >> /var/log/evm-decode.log 2>&1
```

**Systemd** (recommended):
```bash
sudo systemctl enable --now evm-decode.timer
sudo systemctl status evm-decode.timer
```

### 2. Monitor

```bash
# Check decode worker logs
tail -f /var/log/evm-decode.log

# Or systemd
journalctl -u evm-decode.service -f

# Check database growth
fly postgres connect -a yaci-postgrest-db
SELECT
  COUNT(*) as total_txs,
  COUNT(*) FILTER (WHERE type = 2) as eip1559_txs,
  SUM(array_length(topics, 1)) as total_topics
FROM api.evm_transactions t
LEFT JOIN api.evm_logs l ON t.tx_id = l.tx_id;
```

### 3. Performance Check

```bash
# Query response time
time curl "https://yaci-postgrest.fly.dev/rpc/get_transaction_detail?_hash=..." > /dev/null

# Should be < 500ms

# Database indexes
fly postgres connect -a yaci-postgrest-db
SELECT indexname, indexdef FROM pg_indexes WHERE tablename LIKE 'evm_%';
```

---

## Known Limitations

1. **Token metadata incomplete** - Only detects presence, not name/symbol/decimals yet
2. **ERC-721/1155 not parsed** - Only ERC-20 Transfer events decoded
3. **No contract verification** - ABI storage exists but not populated
4. **Log decoding basic** - Shows raw topics/data, no ABI-based decoding

---

## Next Features

1. **Token metadata enrichment** - Call ERC-20 methods to get name/symbol/decimals
2. **ERC-721/1155 support** - Parse NFT transfers
3. **Contract pages** - Display contract code, ABI, transactions
4. **Log ABI decoding** - If contract ABI known, decode log parameters
5. **Cosmos domain watcher** - Track validators, proposals, IBC channels

---

## Support

If you encounter issues:

1. Check logs: `journalctl -u evm-decode.service -n 100`
2. Verify schema: `\dt api.evm_*`
3. Test API directly: `curl https://yaci-postgrest.fly.dev/...`
4. Check frontend console for errors
5. Review CLEAN_RESET_GUIDE.md for troubleshooting
