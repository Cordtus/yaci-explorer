#!/bin/bash
# Deployment script for production
# Usage: ./scripts/deploy.sh [WEBROOT_PATH]
# Example: ./scripts/deploy.sh /var/www/mantrachain-explorer

set -e

# Default webroot path
WEBROOT="${1:-/var/www/mantrachain-explorer}"

echo "=========================================="
echo "Deploying Yaci Explorer"
echo "=========================================="
echo "Webroot: $WEBROOT"
echo ""

# Check if build exists
if [ ! -d "build/client" ]; then
    echo "ERROR: build/client directory not found!"
    echo "Run ./scripts/build-production.sh first"
    exit 1
fi

# Check if webroot exists
if [ ! -d "$WEBROOT" ]; then
    echo "Creating webroot directory: $WEBROOT"
    mkdir -p "$WEBROOT"
fi

# Backup existing deployment
if [ "$(ls -A $WEBROOT)" ]; then
    BACKUP_DIR="${WEBROOT}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backing up existing deployment to: $BACKUP_DIR"
    cp -r "$WEBROOT" "$BACKUP_DIR"
fi

# Deploy
echo "Copying files to webroot..."
rm -rf "$WEBROOT"/*
cp -r build/client/* "$WEBROOT/"

# Set permissions
echo "Setting permissions..."
chmod -R 755 "$WEBROOT"

# Reload web server if systemd service exists
if systemctl is-active --quiet caddy; then
    echo "Reloading Caddy..."
    systemctl reload caddy
elif systemctl is-active --quiet nginx; then
    echo "Reloading Nginx..."
    systemctl reload nginx
fi

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo "Files deployed to: $WEBROOT"
echo ""
echo "Test your deployment:"
echo "  curl https://mantra.basementnodes.ca"
echo "=========================================="
