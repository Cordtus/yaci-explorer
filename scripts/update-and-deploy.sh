#!/bin/bash
# Full update and deployment script
# Usage: ./scripts/update-and-deploy.sh [API_URL] [WEBROOT_PATH]
# Example: ./scripts/update-and-deploy.sh /api /var/www/mantrachain-explorer

set -e

API_URL="${1:-/api}"
WEBROOT="${2:-/var/www/mantrachain-explorer}"

echo "=========================================="
echo "Yaci Explorer - Update & Deploy"
echo "=========================================="
echo "API URL: $API_URL"
echo "Webroot: $WEBROOT"
echo ""

# Pull latest code
echo "Step 1: Pulling latest code..."
git pull origin main

# Build
echo ""
echo "Step 2: Building for production..."
./scripts/build-production.sh "$API_URL"

# Deploy
echo ""
echo "Step 3: Deploying..."
./scripts/deploy.sh "$WEBROOT"

echo ""
echo "=========================================="
echo "Update and deployment complete!"
echo "=========================================="
