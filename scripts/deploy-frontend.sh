#!/bin/bash
# Frontend deployment script (Static files to Caddy)
# Run this on the FRONTEND container (10.70.48.100)
# Usage: ./scripts/deploy-frontend.sh [WEBROOT_PATH]

set -e

WEBROOT="${1:-/var/www/mantrachain-explorer}"
API_URL="/api"  # Caddy will proxy this to backend

echo "=========================================="
echo "Yaci Explorer - Frontend Deployment"
echo "=========================================="
echo "Target: Frontend Container (10.70.48.100)"
echo "Webroot: $WEBROOT"
echo "API URL: $API_URL (proxied to 10.70.48.134:3000)"
echo ""

# Check if running in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found!"
    echo "Please run this script from the yaci-explorer repository root"
    exit 1
fi

# Pull latest code
echo "Step 1: Pulling latest code..."
git pull origin main

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "Step 2: Installing dependencies..."
    npm install
else
    echo ""
    echo "Step 2: Dependencies already installed (skipping)"
fi

# Build for production
echo ""
echo "Step 3: Building for production..."
VITE_POSTGREST_URL="$API_URL" npm run build

# Check if build succeeded
if [ ! -d "build/client" ]; then
    echo "ERROR: Build failed! build/client directory not found"
    exit 1
fi

# Create webroot if it doesn't exist
if [ ! -d "$WEBROOT" ]; then
    echo ""
    echo "Creating webroot directory: $WEBROOT"
    mkdir -p "$WEBROOT"
fi

# Backup existing deployment
if [ "$(ls -A $WEBROOT)" ]; then
    BACKUP_DIR="${WEBROOT}.backup.$(date +%Y%m%d_%H%M%S)"
    echo ""
    echo "Step 4: Backing up existing deployment..."
    echo "Backup location: $BACKUP_DIR"
    cp -r "$WEBROOT" "$BACKUP_DIR"
fi

# Deploy
echo ""
echo "Step 5: Deploying to webroot..."
rm -rf "$WEBROOT"/*
cp -r build/client/* "$WEBROOT/"

# Set permissions
echo ""
echo "Step 6: Setting permissions..."
chmod -R 755 "$WEBROOT"

# Reload web server
echo ""
echo "Step 7: Reloading web server..."
if [ -f /etc/init.d/caddy ]; then
    echo "Reloading Caddy (init.d)..."
    /etc/init.d/caddy reload || /etc/init.d/caddy restart
    echo "✓ Caddy reloaded"
elif systemctl is-active --quiet caddy 2>/dev/null; then
    echo "Reloading Caddy (systemd)..."
    systemctl reload caddy
    echo "✓ Caddy reloaded"
elif [ -f /etc/init.d/nginx ]; then
    echo "Reloading Nginx (init.d)..."
    /etc/init.d/nginx reload
    echo "✓ Nginx reloaded"
elif systemctl is-active --quiet nginx 2>/dev/null; then
    echo "Reloading Nginx (systemd)..."
    systemctl reload nginx
    echo "✓ Nginx reloaded"
else
    echo "⚠ No web server service found"
    echo "Please reload Caddy manually: /etc/init.d/caddy reload"
fi

echo ""
echo "=========================================="
echo "Frontend Deployment Complete!"
echo "=========================================="
echo ""
echo "Deployment details:"
echo "  - Files deployed to: $WEBROOT"
echo "  - API endpoint: $API_URL (proxied by Caddy)"
echo "  - Backend target: http://10.70.48.134:3000"
echo ""
echo "Test your deployment:"
echo "  1. Visit: https://mantra.basementnodes.ca"
echo "  2. Check browser console for errors"
echo "  3. Verify API calls go to /api/* (not localhost)"
echo ""
echo "Troubleshooting:"
echo "  - View Caddy logs: journalctl -u caddy -f"
echo "  - Test backend: curl http://10.70.48.134:3000/blocks_raw?limit=1"
echo "  - Test proxy: curl https://mantra.basementnodes.ca/api/blocks_raw?limit=1"
echo "=========================================="
