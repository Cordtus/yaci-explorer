# Deployment Ready Checklist

## Build Status

- ✅ **Yaci Indexer**: `ghcr.io/cordtus/yaci:poc` - Built and published
- ✅ **Explorer Frontend**: Docker build verified locally

## Quick LXC Deployment

### 1. Pull this repo on your LXC container

```bash
# On your yaci-indexer LXC container
cd /opt
git clone https://github.com/Cordtus/yaci-explorer.git
cd yaci-explorer
```

### 2. Configure environment

```bash
cp .env.example .env
nano .env

# Critical settings:
# CHAIN_GRPC_ENDPOINT=<your-mantrad-container-ip>:9090
# POSTGRES_PASSWORD=<secure-password>
# YACI_IMAGE=ghcr.io/cordtus/yaci:poc
```

### 3. Start the stack

```bash
docker compose -f docker/docker-compose.yml up -d
```

### 4. Verify services

```bash
# Check all containers running
docker compose -f docker/docker-compose.yml ps

# View logs
docker compose -f docker/docker-compose.yml logs -f yaci

# Check PostgreSQL has data
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d yaci -c "SELECT COUNT(*) FROM api.blocks_raw;"

# Test PostgREST API
curl http://localhost:3000/blocks_raw?limit=1

# Test Explorer UI
curl http://localhost:3001
```

## Architecture

```
┌─────────────────────────────────────┐
│  LXC Container: yaci-indexer        │
│  (10.x.x.3)                         │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Explorer (nginx:80)          │   │
│  │ → Port 3001 on host          │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ PostgREST API (3000)         │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ Yaci Indexer                 │   │
│  │ ghcr.io/cordtus/yaci:poc     │   │
│  │ → Connects to mantrad:9090   │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ PostgreSQL (5432)            │   │
│  │ Data: /var/lib/docker/volumes│   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
                  │
                  │ gRPC:9090
                  ▼
┌─────────────────────────────────────┐
│  LXC Container: mantrad             │
│  (10.x.x.2)                         │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ manifestd                    │   │
│  │ Listening: 0.0.0.0:9090      │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Pre-Flight Checklist

Before deployment, ensure:

- [ ] `mantrad` container exists and is running
- [ ] `manifestd` is listening on `0.0.0.0:9090` (not 127.0.0.1)
- [ ] You can reach mantrad from yaci-indexer: `nc -zv 10.x.x.2 9090`
- [ ] `yaci-indexer` container has Docker installed with nesting enabled
- [ ] Port forwarding configured from host to yaci-indexer:3001

## Verification Commands

### On Host
```bash
# Check LXC containers running
lxc list | grep -E "mantrad|yaci-indexer"

# Test port forwarding to explorer
curl http://localhost:3001

# Test PostgREST API
curl http://localhost:3000/blocks_raw?limit=1
```

### On mantrad Container
```bash
login mantrad
systemctl status manifestd
netstat -tlnp | grep 9090  # Should show 0.0.0.0:9090
exit
```

### On yaci-indexer Container
```bash
login yaci-indexer

# Test connection to node
nc -zv 10.x.x.2 9090
grpcurl -plaintext 10.x.x.2:9090 list

# Check Docker services
cd /opt/yaci-explorer
docker compose -f docker/docker-compose.yml ps

# View indexer logs
docker compose -f docker/docker-compose.yml logs -f yaci

# Check database
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d yaci -c "\dt api.*"

exit
```

## Accessing the Explorer

From your local machine:
```
http://<lxc-host-ip>:3001
```

## Monitoring

```bash
# On yaci-indexer container
cd /opt/yaci-explorer

# Watch indexer progress
docker compose -f docker/docker-compose.yml logs -f yaci | grep "block"

# Check Prometheus metrics (if enabled)
curl http://localhost:2112/metrics

# Monitor database size
docker compose -f docker/docker-compose.yml exec postgres \
  psql -U postgres -d yaci -c "SELECT pg_size_pretty(pg_database_size('yaci'));"
```

## Next Steps

1. Follow [LXC_DEPLOYMENT.md](LXC_DEPLOYMENT.md) to set up both containers
2. Start with Part 1 (mantrad container)
3. Then Part 2 (yaci-indexer container)
4. Monitor logs and verify data is indexing
5. Access explorer UI at http://host:3001

## Support

- **Indexer Issues**: https://github.com/manifest-network/yaci/issues
- **Explorer Issues**: https://github.com/Cordtus/yaci-explorer/issues
