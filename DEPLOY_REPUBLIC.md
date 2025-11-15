# Republic Network Deployment Guide

This guide walks you through deploying the Yaci Explorer stack for the Republic network.

## Prerequisites

- Docker and Docker Compose installed
- Access to Republic network gRPC endpoint: `16.16.50.2:9090`
- At least 4GB RAM and 20GB disk space

## Quick Start

### 1. Configure Environment

Copy the Republic-specific environment template:

```bash
cp .env.republic .env
```

Review and adjust settings if needed:
- **CHAIN_GRPC_ENDPOINT**: Already set to `16.16.50.2:9090`
- **CHAIN_ID**: Will auto-detect, but set to `republic-1` by default
- **Branding variables**: Customize the explorer appearance

### 2. Start the Stack

Launch all services (PostgreSQL 18, PostgREST, Yaci indexer, and Explorer UI):

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 3. Monitor Indexing Progress

Watch the Yaci indexer logs:

```bash
docker compose -f docker/docker-compose.yml logs -f yaci
```

You should see:
```
INFO extracting blocks from chain
INFO indexed block height=1 txs=0
INFO indexed block height=2 txs=5
...
```

### 4. Access the Explorer

Once indexing begins, open your browser:

- **Explorer UI**: http://localhost:3001
- **PostgREST API**: http://localhost:3000
- **Prometheus Metrics**: http://localhost:2112/metrics

## Configuration Details

### Chain Auto-Detection

The explorer will automatically detect:
- Chain ID from blockchain
- Native denomination from transactions
- Decimal places from denom prefix
- Available message types from indexed data

### Custom Branding

Edit `.env` to customize the UI:

```bash
# Change the application name
VITE_APP_NAME=Republic Explorer
VITE_APP_NAME_SHORT=Republic

# Add custom logo
VITE_LOGO_URL=https://yourdomain.com/republic-logo.png
VITE_FAVICON_URL=https://yourdomain.com/favicon.ico

# Customize colors (HSL format)
VITE_PRIMARY_COLOR=210 100% 50%
VITE_ACCENT_COLOR=160 100% 45%

# Add social links
VITE_LINK_WEBSITE=https://republic.example.com
VITE_LINK_GITHUB=https://github.com/republic
VITE_LINK_DISCORD=https://discord.gg/republic
```

Then rebuild the explorer service:

```bash
docker compose -f docker/docker-compose.yml up -d --build explorer
```

### Database Persistence

Block data is stored in Docker volumes:
- `postgres-data`: All indexed blockchain data

To completely reset:

```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

⚠️ **Warning**: This deletes ALL indexed data.

## Architecture

```
Republic gRPC (16.16.50.2:9090)
            ↓
    Yaci Indexer (container)
            ↓
  PostgreSQL 18 (container)
            ↓
    PostgREST API (:3000)
            ↓
  Explorer UI (:3001)
```

## Performance Tuning

### Indexer Concurrency

Adjust concurrent block fetching in `.env`:

```bash
# Default: 100 (good for most chains)
YACI_MAX_CONCURRENCY=100

# Slow network: reduce to avoid timeouts
YACI_MAX_CONCURRENCY=50

# Fast network + powerful server: increase
YACI_MAX_CONCURRENCY=200
```

### Database Resources

For heavy indexing loads, allocate more resources to PostgreSQL:

Edit `docker/docker-compose.yml`:

```yaml
postgres:
  image: postgres:18-alpine
  # ... existing config ...
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
```

## Production Deployment

### Using Caddy Reverse Proxy

The included `Caddyfile` provides production-ready HTTPS:

```bash
# Install Caddy
sudo apt install caddy

# Copy Caddyfile
sudo cp Caddyfile /etc/caddy/Caddyfile

# Edit domain
sudo nano /etc/caddy/Caddyfile
# Change `:80` to `your-domain.com`

# Reload Caddy
sudo systemctl reload caddy
```

### Environment Variables for Production

Update `.env` for production:

```bash
# Use relative API path (works through reverse proxy)
VITE_POSTGREST_URL=/api

# Set production mode
NODE_ENV=production

# Use strong password
POSTGRES_PASSWORD=$(openssl rand -base64 32)
```

### Monitoring

Yaci provides Prometheus metrics at `:2112/metrics`:

- `yaci_blocks_indexed_total`: Total blocks indexed
- `yaci_transactions_indexed_total`: Total transactions indexed
- `yaci_indexing_errors_total`: Indexing errors

Add to your Prometheus config:

```yaml
scrape_configs:
  - job_name: 'yaci-republic'
    static_configs:
      - targets: ['localhost:2112']
```

## Troubleshooting

### Explorer Shows No Data

**Check indexer is running:**
```bash
docker compose logs yaci
```

**Verify database has data:**
```bash
docker exec -it yaci-explorer-postgres psql -U postgres -d yaci
```

```sql
-- Check block count
SELECT COUNT(*) FROM api.blocks_raw;

-- Check transactions
SELECT COUNT(*) FROM api.transactions_main;
```

### Connection Refused to gRPC Endpoint

**Test connectivity:**
```bash
docker exec -it yaci-explorer-indexer grpcurl -plaintext 16.16.50.2:9090 list
```

If this fails, check:
- Firewall allows outbound connections to 16.16.50.2:9090
- gRPC endpoint is accessible from Docker containers
- `YACI_INSECURE=-k` is set for non-TLS connections

### PostgreSQL Won't Start

**Check logs:**
```bash
docker compose logs postgres
```

**Common issues:**
- Port 5432 already in use: Change `POSTGRES_PORT` in `.env`
- Volume permissions: `sudo chown -R 999:999 /var/lib/docker/volumes/yaci-explorer_postgres-data`

### Out of Disk Space

**Check disk usage:**
```bash
docker system df
```

**Clean up old data:**
```bash
# Remove unused images
docker image prune -a

# Check volume size
docker volume ls
du -sh /var/lib/docker/volumes/yaci-explorer_postgres-data
```

## Updates & Maintenance

### Update Yaci Indexer

Pull latest image:

```bash
docker compose pull yaci
docker compose up -d yaci
```

### Update Explorer UI

Rebuild from latest code:

```bash
docker compose up -d --build explorer
```

### Backup Database

```bash
# Create backup
docker exec yaci-explorer-postgres pg_dump -U postgres yaci > republic_backup_$(date +%Y%m%d).sql

# Restore backup
cat republic_backup_20250115.sql | docker exec -i yaci-explorer-postgres psql -U postgres yaci
```

## Support

- **Yaci Indexer Issues**: https://github.com/Cordtus/yaci/issues
- **Explorer Issues**: https://github.com/Cordtus/yaci-explorer/issues
- **Chain Configuration**: Edit `src/config/chains.ts` and rebuild

## Summary

You now have a fully configured Republic Network explorer:

✅ PostgreSQL 18 database
✅ Yaci indexer connected to Republic gRPC
✅ PostgREST API at http://localhost:3000
✅ Explorer UI at http://localhost:3001
✅ Customizable branding
✅ Prometheus metrics at http://localhost:2112

The explorer will continue indexing blocks in real-time. Check the UI after a few minutes to see indexed data!
