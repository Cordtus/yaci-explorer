#!/usr/bin/env bash
# Manual database reset script.
# WARNING: This will WIPE all indexed data. Use only when necessary.
#
# Supports both Docker and bare-metal deployments:
#   Docker: Stops services, removes postgres volume, restarts
#   Bare-metal: Truncates index tables via psql

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_FILE="docker/docker-compose.yml"

echo "========================================"
echo "    DATABASE RESET"
echo "========================================"
echo ""
echo "WARNING: This will DELETE all indexed blockchain data."
echo "The indexer will need to re-sync from scratch."
echo ""

if [[ "${SKIP_CONFIRM:-0}" != "1" ]]; then
  read -r -p "Are you sure you want to proceed? [y/N] " reply
  case "$reply" in
    [yY][eE][sS]|[yY]) ;;
    *) echo "Aborted."; exit 0 ;;
  esac
fi

# Docker deployment
if command -v docker >/dev/null 2>&1 && [[ -f "$COMPOSE_FILE" ]]; then
  echo ""
  echo "Detected Docker deployment..."
  echo "Stopping services and removing postgres volume..."
  docker compose -f "$COMPOSE_FILE" down -v
  echo ""
  echo "Starting services..."
  docker compose -f "$COMPOSE_FILE" up -d --build
  echo ""
  echo "Done. Indexer will re-sync from genesis."
  exit 0
fi

# Bare-metal deployment
echo ""
echo "Detected bare-metal deployment..."

[[ -f "${REPO_ROOT}/.env" ]] && set -a && source "${REPO_ROOT}/.env" && set +a

PGHOST="${POSTGRES_HOST:-localhost}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-postgres}"
PGPASSWORD="${POSTGRES_PASSWORD:-changeme}"
PGDATABASE="${POSTGRES_DB:-yaci}"

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: psql is required for bare-metal reset." >&2
  exit 1
fi

echo "Truncating index tables..."
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" <<'SQL'
TRUNCATE
  api.blocks_raw,
  api.transactions_main,
  api.transactions_raw,
  api.messages_main,
  api.messages_raw,
  api.events_main,
  api.events_raw
RESTART IDENTITY CASCADE;
SQL

echo ""
echo "Done. Restart the indexer to re-sync from genesis:"
echo "  sudo systemctl restart yaci-indexer"
