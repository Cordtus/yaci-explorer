# Yaci Explorer Deployment

## Architecture

```
Chain (gRPC) -> Yaci Indexer -> PostgreSQL -> PostgREST -> Explorer UI
```

## Quick Start

```bash
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer
cp .env.example .env
yarn configure:env
# Set CHAIN_GRPC_ENDPOINT in .env
docker compose -f docker/docker-compose.yml up -d
```

Access: http://localhost:3001

Monitor:
```bash
docker compose -f docker/docker-compose.yml logs -f yaci
docker exec -it yaci-explorer-postgres psql -U yaci -d yaci -c "SELECT MAX(id) FROM api.blocks_raw;"
```

## Deployment Methods

### Docker Compose (Recommended)

```bash
./scripts/setup.sh  # Option 1
# Or manually:
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d
```

### Systemd (Bare Metal)

```bash
sudo ./scripts/setup.sh  # Option 2
```

Installs PostgreSQL, PostgREST, Yaci indexer, Node.js frontend as systemd services.

### Frontend Only

```bash
./scripts/setup.sh  # Option 3
```

Connect to existing PostgREST instance.

## Fly.io Deployment

```bash
# PostgreSQL
fly postgres create --name yaci-pg

# Yaci Indexer
cd /path/to/yaci
fly launch --name yaci-indexer
fly secrets set YACI_POSTGRES_DSN="postgres://..." YACI_GRPC_ENDPOINT="..."

# Explorer
cd /path/to/yaci-explorer
fly launch --name yaci-explorer

# Configure frontend via config.json
cat > config.json << EOF
{
  "apiUrl": "https://your-postgrest-url.fly.dev",
  "chainRestEndpoint": "https://api.yourchain.io",
  "evmEnabled": true,
  "ibcEnabled": true,
  "appName": "My Explorer"
}
EOF

# Copy config to deployed container
fly ssh console -C "cat > /usr/share/nginx/html/config.json" < config.json
```

## Reverse Proxy

### Caddy
```
yourdomain.com {
    reverse_proxy /api/* localhost:3000 {
        header_up -/api
    }
    reverse_proxy localhost:3001
}
```

### Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location /api/ {
        proxy_pass http://localhost:3000/;
    }
    location / {
        proxy_pass http://localhost:3001;
    }
}
```

## Configuration

### Frontend Configuration (config.json)

Frontend configuration is provided at runtime via `config.json` instead of build-time environment variables.

**Create config.json:**
```bash
cp public/config.json.example public/config.json
# Edit config.json with your settings
```

**Key settings:**
- `apiUrl`: PostgREST endpoint URL (required)
- `chainRestEndpoint`: Chain REST API for IBC denom resolution (optional)
- `evmEnabled`: Enable/disable EVM features
- `ibcEnabled`: Enable/disable IBC features
- `appName`: Custom application name
- `branding`: Logo URLs, colors, footer text
- `links`: Website, docs, social media links

**Docker deployment:**
```bash
# Mount config.json as volume
docker run -v ./config.json:/usr/share/nginx/html/config.json ...

# Or copy to running container
docker cp config.json container:/usr/share/nginx/html/config.json
```

See `public/config.json.example` for all available options.

### Backend Configuration (.env)

**Docker/Backend:**
- `CHAIN_GRPC_ENDPOINT`: gRPC endpoint of chain (required)
- `YACI_IMAGE`: Yaci Docker image (default: ghcr.io/cordtus/yaci:main)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: foobar)
- `CHAIN_ID`, `CHAIN_NAME`: Override auto-detection

### EVM Support

Enable via config.json:
```json
{
  "evmEnabled": true
}
```

### Prometheus Metrics

Default: http://localhost:2112/metrics

Scrape config:
```yaml
scrape_configs:
  - job_name: yaci-indexer
    static_configs: [{ targets: ['localhost:2112'] }]
```

## Database Operations

### Complete Reset (Docker)

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

### Truncate Tables (Keep Container)

```bash
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d postgres
docker exec -it yaci-explorer-postgres psql -U yaci -d yaci -c \
  "TRUNCATE api.blocks_raw, api.transactions_main, api.messages_main, api.events_main;"
docker compose -f docker/docker-compose.yml up -d
```

### Systemd Reset

```bash
sudo -u postgres dropdb yaci
sudo -u postgres createdb yaci
sudo systemctl restart yaci
```

### Devnet Reset Script

```bash
./scripts/reset-devnet.sh
# Custom compose file:
./scripts/reset-devnet.sh --compose-file path/to/compose.yml
# Non-interactive:
SKIP_CONFIRM=1 ./scripts/reset-devnet.sh
```

Bare metal:
```bash
# Full redeploy with rebuild:
yarn redeploy:systemd
```

## Database Schema

- `blocks_raw`: id (bigint), data (jsonb)
- `transactions_main`: id (text), height (bigint), timestamp, fee (jsonb), gas_used (bigint), error (text)
- `messages_main`: id (text), message_index (int), type (text), sender (text), mentions (text[]), metadata (jsonb)
- `events_main`: id (text), event_index (int), event_type (text), attr_key (text), attr_value (text)
- `evm_transactions`: tx_id (text), evm_hash (text), type (int), from_address (text), to_address (text), value (text), gas_limit (bigint), gas_price (text), nonce (bigint), data (text), logs (jsonb)
- `evm_logs`: tx_id (text), log_index (int), address (text), topics (text[]), data (text)
- `evm_tokens`: address (text), name (text), symbol (text), decimals (int)
- `evm_token_transfers`: tx_id (text), log_index (int), token_address (text), from_address (text), to_address (text), value (text)

## Common Operations

```bash
# Logs
docker compose -f docker/docker-compose.yml logs -f

# Status
docker compose -f docker/docker-compose.yml ps

# Restart
docker compose -f docker/docker-compose.yml restart

# Update Yaci
docker compose -f docker/docker-compose.yml pull yaci
docker compose -f docker/docker-compose.yml up -d yaci

# Rebuild Explorer
docker compose -f docker/docker-compose.yml up -d --build explorer

# Check Progress
docker exec -it yaci-explorer-postgres psql -U yaci -d yaci -c "SELECT MAX(id) FROM api.blocks_raw;"
```

## EVM Deployment

### Middleware Migration

```bash
cd ~/repos/yaci-explorer-apis
export DATABASE_URL="<your-db-url>"
./scripts/migrate.sh
```

Verify:
```sql
\dt api.evm_*
```

### Initial Decode

```bash
yarn decode:evm
```

### Continuous Decoding

Systemd (recommended):
```bash
sudo systemctl enable --now evm-decode.timer
sudo systemctl status evm-decode.timer
```

Cron:
```bash
*/5 * * * * cd ~/repos/yaci-explorer-apis && DATABASE_URL="..." yarn decode:evm >> /var/log/evm-decode.log 2>&1
```

## Monitoring

Docker:
```bash
docker logs yaci-indexer -f
```

Systemd:
```bash
journalctl -u yaci -f
```

Database:
```sql
SELECT
  COUNT(*) as total_txs,
  COUNT(*) FILTER (WHERE type = 2) as eip1559_txs,
  SUM(array_length(topics, 1)) as total_topics
FROM api.evm_transactions t
LEFT JOIN api.evm_logs l ON t.tx_id = l.tx_id;
```

## Troubleshooting

### gRPC Connection Failed
- Verify CHAIN_GRPC_ENDPOINT
- Check chain node accessibility
- For local Docker chains use host.docker.internal:9090

### PostgREST Connection Refused
- Wait for PostgreSQL initialization
- Verify migrations completed
- Check api schema exists

### No Data in Explorer
- Check Yaci logs for "Extracting blocks"
- Test PostgREST: `curl http://localhost:3000/blocks_raw?limit=1`

## Resource Sizing

- Small/test: 2 vCPU, 4GB RAM, 50GB storage, YACI_MAX_CONCURRENCY=50
- Medium: 4 vCPU, 8GB RAM, 200GB storage, YACI_MAX_CONCURRENCY=100
- Large: 8 vCPU, 16GB RAM, 500GB+ storage, YACI_MAX_CONCURRENCY=200

Storage: ~1-5GB per million blocks (varies by transaction volume)

## Default Service URLs

- Explorer UI: http://localhost:3001
- PostgREST API: http://localhost:3000
- Prometheus: http://localhost:2112
- PostgreSQL: localhost:5432

## Multiple Chains

Run separate stacks with different ports in separate directories. Configure:
- POSTGRES_PORT
- POSTGREST_PORT
- EXPLORER_PORT
- YACI_METRICS_PORT

## Backup

```bash
docker exec yaci-explorer-postgres pg_dump -U yaci -d yaci -F c -f /tmp/backup.dump
docker cp yaci-explorer-postgres:/tmp/backup.dump /backups/backup_$(date +%Y%m%d_%H%M%S).dump
find /backups -name "backup_*.dump" -mtime +7 -delete
```

## Support

- Yaci Indexer: https://github.com/Cordtus/yaci/issues
- Middleware: https://github.com/Cordtus/yaci-explorer-apis/issues
- Explorer: https://github.com/Cordtus/yaci-explorer/issues
- PostgREST: https://postgrest.org/
