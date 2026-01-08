#!/usr/bin/env bash
# Rebuild and restart the explorer UI.
# Supports docker-compose and bare-metal/systemd deployments.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_FILE="docker/docker-compose.yml"

echo "========================================="
echo "Rebuilding Yaci Explorer UI"
echo "========================================="

# Docker deployment
if command -v docker >/dev/null 2>&1 && [[ -f "$COMPOSE_FILE" ]]; then
  echo "Detected docker-compose deployment..."
  docker compose -f "$COMPOSE_FILE" stop explorer || true
  docker compose -f "$COMPOSE_FILE" rm -f explorer || true
  docker compose -f "$COMPOSE_FILE" build --no-cache explorer
  docker compose -f "$COMPOSE_FILE" up -d explorer
  echo "Done. Showing logs (Ctrl+C to exit)..."
  docker compose -f "$COMPOSE_FILE" logs -f explorer
  exit 0
fi

# Systemd deployment
if ! command -v bun >/dev/null 2>&1; then
  echo "[error] bun is required. Install from https://bun.sh" >&2
  exit 1
fi

EXPLORER_SERVICE="${YACI_EXPLORER_SERVICE:-yaci-explorer.service}"

echo "Installing dependencies..."
bun install

echo "Building..."
bun run deploy:build

echo "Restarting $EXPLORER_SERVICE..."
sudo systemctl restart "$EXPLORER_SERVICE"

echo "Done. Use 'journalctl -u $EXPLORER_SERVICE -f' to watch logs."
