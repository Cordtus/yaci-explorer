# Two-Container Deployment Guide

This guide covers deploying yaci-explorer across two separate LXC containers:
- **Backend Container (10.70.48.134)**: PostgreSQL, PostgREST, Yaci indexer
- **Frontend Container (10.70.48.100)**: Caddy web server with static files

## Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend Container (10.70.48.100)          │
│  ┌─────────────────────────────────────┐    │
│  │  Caddy Web Server                   │    │
│  │  - Serves static files              │    │
│  │  - Proxies /api/* → Backend         │    │
│  └─────────────────────────────────────┘    │
└─────────────────┬───────────────────────────┘
                  │ HTTPS
                  │
        ┌─────────▼─────────┐
        │   Internet Users  │
        └───────────────────┘

┌─────────────────────────────────────────────┐
│  Backend Container (10.70.48.134)           │
│  ┌─────────────────────────────────────┐    │
│  │  PostgreSQL                         │    │
│  │  - Stores indexed blockchain data   │    │
│  └────────────┬────────────────────────┘    │
│               │                              │
│  ┌────────────▼────────────────────────┐    │
│  │  PostgREST API (port 3000)          │    │
│  │  - Auto-generated REST API          │    │
│  └────────────┬────────────────────────┘    │
│               │                              │
│  ┌────────────▼────────────────────────┐    │
│  │  Yaci Indexer                       │    │
│  │  - Indexes blockchain data          │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Prerequisites

### Backend Container (10.70.48.134)
- Docker and Docker Compose
- Access to chain gRPC endpoint
- Git

### Frontend Container (10.70.48.100)
- Node.js 20+
- Caddy web server (with init.d or systemd)
- Git

## Step 1: Deploy Backend (10.70.48.134)

SSH into your backend container:

```bash
ssh root@10.70.48.134
```

Clone the repository:

```bash
cd /opt
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer
```

Configure environment:

```bash
cp .env.example .env
nano .env
```

Set these variables in `.env`:

```bash
# Point to your chain's gRPC endpoint
CHAIN_GRPC_ENDPOINT=localhost:9090  # or your chain's IP:port

# Database password (use a strong password!)
POSTGRES_PASSWORD=your_secure_password_here

# Chain information
CHAIN_ID=manifest-1
CHAIN_NAME=Manifest Network

# Yaci image (use the Cordtus fork with explorer support)
YACI_IMAGE=ghcr.io/cordtus/yaci:poc
```

Deploy backend services:

```bash
./scripts/deploy-backend.sh
```

This script will:
1. Pull latest code
2. Stop any existing containers
3. Pull latest Docker images
4. Start PostgreSQL, PostgREST, and Yaci indexer
5. Verify services are running

Verify backend is working:

```bash
# Test PostgreSQL
docker compose -f docker/docker-compose.yml exec postgres pg_isready

# Test PostgREST API
curl http://localhost:3000/blocks_raw?limit=1

# Check Yaci logs
docker compose -f docker/docker-compose.yml logs -f yaci
```

Test from frontend container:

```bash
# From 10.70.48.100, test backend access
curl http://10.70.48.134:3000/blocks_raw?limit=1
```

## Step 2: Configure Caddy (10.70.48.100)

SSH into your frontend container:

```bash
ssh root@10.70.48.100
```

Configure Caddy to proxy API requests. Edit your Caddyfile:

```bash
nano /etc/caddy/Caddyfile
```

Add this configuration:

```
mantra.basementnodes.ca {
    root * /var/www/mantrachain-explorer

    # API calls → PostgREST on backend container
    handle /api/* {
        uri strip_prefix /api
        reverse_proxy 10.70.48.134:3000
    }

    # Everything else → serve static files
    try_files {path} /index.html
    file_server
    encode gzip
}
```

Reload Caddy:

```bash
# For init.d
/etc/init.d/caddy reload

# For systemd
systemctl reload caddy
```

Verify Caddy proxy is working:

```bash
curl https://mantra.basementnodes.ca/api/blocks_raw?limit=1
```

This should return the same data as calling the backend directly.

## Step 3: Deploy Frontend (10.70.48.100)

Still on the frontend container, clone the repository:

```bash
cd /opt
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer
```

Deploy frontend:

```bash
./scripts/deploy-frontend.sh
```

This script will:
1. Pull latest code
2. Install dependencies (if needed)
3. Build with API_URL=/api (for Caddy proxy)
4. Deploy to /var/www/mantrachain-explorer
5. Reload Caddy

## Step 4: Verify Deployment

Visit your site:

```
https://mantra.basementnodes.ca
```

Check browser console (F12):
- ✓ No "localhost" in any URLs
- ✓ No "Mixed Content" errors
- ✓ API calls go to `/api/*`
- ✓ No connection errors

Test specific functionality:
- View blocks list
- View transaction details
- Search for blocks/transactions
- Check analytics page

## Updates and Maintenance

### Updating Backend

```bash
# On backend container (10.70.48.134)
cd /opt/yaci-explorer
./scripts/deploy-backend.sh
```

### Updating Frontend

```bash
# On frontend container (10.70.48.100)
cd /opt/yaci-explorer
./scripts/deploy-frontend.sh
```

### Updating Both

Run backend first, then frontend:

```bash
# On backend (10.70.48.134)
cd /opt/yaci-explorer
./scripts/deploy-backend.sh

# On frontend (10.70.48.100)
cd /opt/yaci-explorer
./scripts/deploy-frontend.sh
```

## Monitoring

### Backend Container

```bash
# View all logs
docker compose -f docker/docker-compose.yml logs -f

# View specific service logs
docker compose -f docker/docker-compose.yml logs -f yaci
docker compose -f docker/docker-compose.yml logs -f postgrest

# Check service status
docker compose -f docker/docker-compose.yml ps

# Check database size
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d yaci -c "SELECT pg_size_pretty(pg_database_size('yaci'));"
```

### Frontend Container

```bash
# View Caddy logs (init.d)
tail -f /var/log/caddy/access.log
tail -f /var/log/caddy/error.log

# View Caddy logs (systemd)
journalctl -u caddy -f

# Test Caddy config
caddy validate --config /etc/caddy/Caddyfile
```

## Troubleshooting

### Backend Issues

**Yaci not indexing:**

```bash
# Check Yaci logs
docker compose -f docker/docker-compose.yml logs yaci

# Verify gRPC endpoint
nc -zv <your-chain-ip> 9090

# Check if Yaci can reach the chain
docker compose -f docker/docker-compose.yml exec yaci \
  curl -k <your-grpc-endpoint>
```

**PostgREST not responding:**

```bash
# Check if PostgREST is running
docker compose -f docker/docker-compose.yml ps postgrest

# Check PostgREST logs
docker compose -f docker/docker-compose.yml logs postgrest

# Verify database connection
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d yaci -c "SELECT count(*) FROM api.blocks_raw;"
```

### Frontend Issues

**API calls failing:**

```bash
# Test backend directly
curl http://10.70.48.134:3000/blocks_raw?limit=1

# Test through Caddy proxy
curl https://mantra.basementnodes.ca/api/blocks_raw?limit=1

# Check Caddy logs
tail -f /var/log/caddy/error.log
```

**Static files not loading:**

```bash
# Check webroot permissions
ls -la /var/www/mantrachain-explorer/

# Check if files exist
ls /var/www/mantrachain-explorer/assets/

# Rebuild if needed
cd /opt/yaci-explorer
VITE_POSTGREST_URL=/api npm run build
cp -r build/client/* /var/www/mantrachain-explorer/
```

**Old version still showing:**

```bash
# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

# Check deployed files are new
ls -lt /var/www/mantrachain-explorer/

# Rebuild with cache bust
cd /opt/yaci-explorer
rm -rf build node_modules/.vite
VITE_POSTGREST_URL=/api npm run build
```

## Security Considerations

### Backend Container

1. **Firewall**: Only expose port 3000 to frontend container
   ```bash
   ufw allow from 10.70.48.100 to any port 3000
   ufw deny 3000
   ```

2. **PostgreSQL**: Never expose port 5432 externally
   - Already isolated in docker-compose (no port mapping)

3. **Strong passwords**: Use secure passwords in .env
   ```bash
   # Generate a secure password
   openssl rand -base64 32
   ```

### Frontend Container

1. **HTTPS only**: Caddy handles this automatically
2. **API proxy**: Never expose backend directly to internet
3. **Regular updates**: Keep Caddy and Node.js updated

## Backup Strategy

### Database Backup

```bash
# On backend container (10.70.48.134)
docker compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U postgres yaci > yaci-backup-$(date +%Y%m%d).sql

# Restore from backup
docker compose -f docker/docker-compose.yml exec -T postgres \
  psql -U postgres yaci < yaci-backup-20251015.sql
```

### Configuration Backup

```bash
# Backend
tar -czf backend-config-$(date +%Y%m%d).tar.gz \
  /opt/yaci-explorer/.env \
  /opt/yaci-explorer/docker/docker-compose.yml

# Frontend
tar -czf frontend-config-$(date +%Y%m%d).tar.gz \
  /etc/caddy/Caddyfile \
  /var/www/mantrachain-explorer
```

## Performance Tuning

### Backend Optimization

Edit `docker/docker-compose.yml`:

```yaml
services:
  postgres:
    environment:
      # Increase shared buffers for better performance
      - POSTGRES_INITDB_ARGS=-c shared_buffers=256MB -c max_connections=200
```

### Frontend Optimization

Caddy is already optimized, but you can add caching:

```
mantra.basementnodes.ca {
    root * /var/www/mantrachain-explorer

    # Cache static assets
    @static {
        path *.js *.css *.png *.jpg *.svg *.woff *.woff2
    }
    header @static Cache-Control "public, max-age=31536000, immutable"

    handle /api/* {
        uri strip_prefix /api
        reverse_proxy 10.70.48.134:3000
    }

    try_files {path} /index.html
    file_server
    encode gzip
}
```

## Getting Help

- **Yaci Indexer Issues**: https://github.com/manifest-network/yaci/issues
- **Explorer Issues**: https://github.com/Cordtus/yaci-explorer/issues
- **PostgREST Docs**: https://postgrest.org/
- **Caddy Docs**: https://caddyserver.com/docs/
