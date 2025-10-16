#!/bin/bash

# Rebuild and restart the explorer UI with updated configuration
# This script rebuilds the Docker image and restarts the container

set -e

echo "========================================="
echo "Rebuilding Yaci Explorer UI"
echo "========================================="

cd "$(dirname "$0")/.."

# Stop and remove existing explorer container
echo ""
echo "Step 1: Stopping existing explorer container..."
docker compose -f docker/docker-compose.yml stop explorer
docker compose -f docker/docker-compose.yml rm -f explorer

# Rebuild the explorer image
echo ""
echo "Step 2: Rebuilding explorer Docker image..."
docker compose -f docker/docker-compose.yml build --no-cache explorer

# Start the explorer container
echo ""
echo "Step 3: Starting explorer container..."
docker compose -f docker/docker-compose.yml up -d explorer

# Show logs
echo ""
echo "Step 4: Showing logs (Ctrl+C to exit)..."
echo ""
docker compose -f docker/docker-compose.yml logs -f explorer
