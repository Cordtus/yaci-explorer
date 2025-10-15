#!/bin/bash
# Build script for production deployment
# Usage: ./scripts/build-production.sh [API_URL]
# Example: ./scripts/build-production.sh /api

set -e

# Default API URL (uses Caddy proxy)
API_URL="${1:-/api}"

echo "=========================================="
echo "Building Yaci Explorer for Production"
echo "=========================================="
echo "API URL: $API_URL"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Clean previous build
if [ -d "build" ]; then
    echo "Cleaning previous build..."
    rm -rf build
fi

# Build with specified API URL
echo "Building application..."
VITE_POSTGREST_URL="$API_URL" npm run build

echo ""
echo "=========================================="
echo "Build complete!"
echo "=========================================="
echo "Build output: ./build/client/"
echo ""
echo "Next steps:"
echo "  1. Deploy: ./scripts/deploy.sh"
echo "  2. Or manually copy: cp -r build/client/* /var/www/mantrachain-explorer/"
echo "=========================================="
