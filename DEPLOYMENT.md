# Production Deployment Guide

## Your Setup

- **Caddy Server**: 10.70.48.100 (serves static files + proxies API)
- **Backend (PostgREST)**: 10.70.48.134:3000
- **Caddy Config**: Proxies `/api/*` → `10.70.48.134:3000`

## Steps to Deploy

### 1. Pull Latest Code

On your development machine:

```bash
cd /path/to/yaci-explorer
git pull origin main
```

### 2. Build with Correct API URL

Since Caddy proxies `/api/*` to your backend, build with:

```bash
VITE_POSTGREST_URL=/api npm run build
```

This makes all API calls go to `/api` (relative URL), which Caddy will proxy to your backend at 10.70.48.134:3000.

### 3. Copy Build to Caddy Server

```bash
# From your dev machine:
rsync -av build/client/ root@10.70.48.100:/var/www/mantrachain-explorer/
```

Or if you're building on the Caddy server directly:

```bash
# On Caddy server (10.70.48.100):
cd /opt/yaci-explorer  # or wherever you cloned the repo
git pull
VITE_POSTGREST_URL=/api npm run build
cp -r build/client/* /var/www/mantrachain-explorer/
```

### 4. Verify Caddy Config

Your Caddy config should look like this:

```
mantra.basementnodes.ca {
    root * /var/www/mantrachain-explorer

    # API calls → PostgREST in backend container
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

### 5. Reload Caddy

```bash
systemctl reload caddy
# or
caddy reload --config /etc/caddy/Caddyfile
```

### 6. Test

Visit `https://mantra.basementnodes.ca` and check the browser console:
- Should see API calls going to `/api/*` (not localhost)
- No mixed content errors
- No connection refused errors

## Troubleshooting

### Still seeing localhost:3010 errors?

The old build is cached. Clear it:

```bash
rm -rf /var/www/mantrachain-explorer/*
cp -r build/client/* /var/www/mantrachain-explorer/
```

Clear browser cache or do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R).

### API calls failing?

Check that PostgREST is running on the backend:

```bash
curl http://10.70.48.134:3000/blocks_raw?limit=1
```

Should return JSON data.

### Caddy proxy not working?

Check Caddy logs:

```bash
journalctl -u caddy -f
```

Test the proxy directly:

```bash
curl https://mantra.basementnodes.ca/api/blocks_raw?limit=1
```

Should return the same data as the direct backend call.

## Alternative: Use Full URL

If you prefer not to use Caddy as a proxy, you can build with the full backend URL:

```bash
VITE_POSTGREST_URL=http://10.70.48.134:3000 npm run build
```

**Note**: This will cause mixed content errors since your site is HTTPS but the API is HTTP. You'd need to either:
1. Set up HTTPS for PostgREST (using Caddy or nginx)
2. Use the proxy approach above (recommended)

## Automated Deployment Script

Create `/opt/deploy-explorer.sh`:

```bash
#!/bin/bash
set -e

echo "Pulling latest code..."
cd /opt/yaci-explorer
git pull

echo "Building explorer..."
VITE_POSTGREST_URL=/api npm run build

echo "Deploying to webroot..."
rm -rf /var/www/mantrachain-explorer/*
cp -r build/client/* /var/www/mantrachain-explorer/

echo "Reloading Caddy..."
systemctl reload caddy

echo "Deployment complete!"
echo "Visit https://mantra.basementnodes.ca to verify"
```

Make it executable:

```bash
chmod +x /opt/deploy-explorer.sh
```

Then deploy with:

```bash
/opt/deploy-explorer.sh
```
