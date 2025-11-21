# Frontend Deployment

## Setup

1. Create the app:
```bash
fly apps create republic-explorer
```

2. Deploy (from repo root):
```bash
fly deploy -c deploy/frontend/fly.toml
```

## Configuration

- **API URL**: Set via `VITE_POSTGREST_URL` build arg in fly.toml
- **Port**: Nginx on port 80
- **SPA Routing**: All routes fallback to index.html

## Update API URL

Edit `deploy/frontend/fly.toml`:
```toml
[build.args]
  VITE_POSTGREST_URL = "https://your-postgrest-url.fly.dev"
```

## Verify Deployment

```bash
curl https://republic-explorer.fly.dev/health
```
