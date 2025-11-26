#!/bin/bash

# Rebuild and restart the explorer UI with updated configuration.
# This script supports both docker-compose and bare-metal/systemd deployments:
# - If docker is available, it rebuilds the explorer image and restarts the container.
# - Otherwise, it runs a deploy build and restarts only the explorer systemd service.

set -euo pipefail

echo "========================================="
echo "Rebuilding Yaci Explorer UI"
echo "========================================="

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_FILE="docker/docker-compose.yml"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 && [[ -f "$COMPOSE_FILE" ]]; then
  echo ""
  echo "Detected docker-compose deployment; rebuilding explorer container..."

  echo ""
  echo "Step 1: Stopping existing explorer container..."
  docker compose -f "$COMPOSE_FILE" stop explorer || true
  docker compose -f "$COMPOSE_FILE" rm -f explorer || true

  echo ""
  echo "Step 2: Rebuilding explorer Docker image..."
  docker compose -f "$COMPOSE_FILE" build --no-cache explorer

  echo ""
  echo "Step 3: Starting explorer container..."
  docker compose -f "$COMPOSE_FILE" up -d explorer

  echo ""
  echo "Step 4: Showing logs (Ctrl+C to exit)..."
  echo ""
  docker compose -f "$COMPOSE_FILE" logs -f explorer
  exit 0
fi

echo ""
echo "No docker-compose deployment detected; assuming bare-metal/systemd setup."

YARN_BIN="${YARN_BIN:-yarn}"
EXPLORER_SERVICE="${YACI_EXPLORER_SERVICE:-yaci-explorer.service}"

if ! command -v "$YARN_BIN" >/dev/null 2>&1; then
  echo "yarn is required to rebuild the explorer (set YARN_BIN to override lookup)." >&2
  exit 1
fi

if ! command -v systemctl >/dev/null 2>&1; then
  echo "systemd (systemctl) is required to restart the explorer service in bare-metal mode." >&2
  exit 1
fi

echo ""
echo "Step 1: Installing dependencies with $YARN_BIN (including dev deps)..."
"$YARN_BIN" install --production=false

echo ""
echo "Step 2: Running deploy build..."
"$YARN_BIN" deploy:build

echo ""
echo "Step 3: Restarting explorer systemd service ($EXPLORER_SERVICE)..."
sudo systemctl restart "$EXPLORER_SERVICE"

echo ""
echo "Done. Use 'journalctl -u $EXPLORER_SERVICE -f' to watch explorer logs."
