# Deployment Guide

## Architecture

```
Chain (gRPC) -> Yaci Indexer -> PostgreSQL -> PostgREST -> Explorer UI
```

## Deployment Options

### 1. Docker Compose (Recommended)

Everything runs in containers. Best for quick setup and cloud deployments.

```bash
./scripts/setup.sh
# Select option 1
```

Or manually:
```bash
cp .env.example .env
# Edit .env with your settings
docker compose -f docker/docker-compose.yml up -d
```

### 2. Native (Systemd)

Installs services directly on the host. Best for VPS deployments.

```bash
sudo ./scripts/setup.sh
# Select option 2
```

This installs and configures:
- PostgreSQL
- PostgREST
- Yaci indexer
- Node.js frontend server

### 3. Frontend Only

Connect to an existing PostgREST instance.

```bash
./scripts/setup.sh
# Select option 3
```

## Fly.io Deployment

### 1. Create Postgres Cluster
```bash
fly postgres create --name yaci-pg
```

### 2. Deploy Yaci Indexer
```bash
cd /path/to/yaci
fly launch --name yaci-indexer
fly secrets set YACI_POSTGRES_DSN="postgres://..." YACI_GRPC_ENDPOINT="..."
```

### 3. Deploy Explorer
```bash
fly launch --name yaci-explorer
# Set VITE_POSTGREST_URL to your PostgREST endpoint
```

## Reverse Proxy (Production)

For production, put a reverse proxy in front:

**Caddy:**
```
yourdomain.com {
    reverse_proxy /api/* localhost:3000 {
        header_up -/api
    }
    reverse_proxy localhost:3001
}
```

**Nginx:**
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

## Database Reset

To completely reset and re-index:

**Docker:**
```bash
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up -d
```

**Native:**
```bash
sudo -u postgres dropdb yaci
sudo -u postgres createdb yaci
sudo systemctl restart yaci
```

## Monitoring

- **Prometheus metrics:** http://localhost:2112/metrics
- **Check indexer logs:**
  - Docker: `docker logs yaci-indexer -f`
  - Native: `journalctl -u yaci -f`

## Troubleshooting

### "Failed to connect to gRPC"
- Verify `CHAIN_GRPC_ENDPOINT` is correct
- Check if the chain node is running and accessible
- For local chains in Docker, use `host.docker.internal:9090`

### "Connection refused" to PostgREST
- Wait for PostgreSQL to be healthy
- Check that migrations completed (Yaci creates the `api` schema)

### Explorer shows no data
- Verify Yaci is indexing: check logs for "Extracting blocks"
- Check PostgREST is running: `curl http://localhost:3000/blocks_raw?limit=1`

## Advanced Configuration

### Multiple Chains

Run separate stacks with different ports in separate directories.

### Custom Yaci Build

```bash
git clone https://github.com/cordtus/yaci
cd yaci && docker build -t yaci:local .
# Then use YACI_IMAGE=yaci:local in docker-compose
```

### IBC Denomination Resolution

Set `VITE_CHAIN_REST_ENDPOINT` in .env to your chain's REST API for automatic IBC denom resolution.
