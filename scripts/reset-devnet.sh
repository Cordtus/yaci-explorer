#!/usr/bin/env bash
# Reset the explorer stack for devnet/genesis restarts.
# - Tears down Docker services and wipes the Postgres volume.
# - Brings the stack back up.
#
# Usage: ./scripts/reset-devnet.sh [--compose-file docker/docker-compose.yml]
# Set SKIP_CONFIRM=1 to run without an interactive prompt.

set -euo pipefail

COMPOSE_FILE="docker/docker-compose.yml"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for this reset helper." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose V2 is required (the 'compose' subcommand)." >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file not found: $COMPOSE_FILE" >&2
  exit 1
fi

echo "=========================================="
echo "Yaci Explorer Devnet Reset"
echo "Compose file: $COMPOSE_FILE"
echo "This will stop services and delete the Postgres volume (postgres-data)."
echo "=========================================="

if [[ "${SKIP_CONFIRM:-0}" != "1" ]]; then
  read -r -p "Proceed with destructive reset? [y/N] " reply
  case "$reply" in
    [yY][eE][sS]|[yY]) ;;
    *) echo "Abort."; exit 0 ;;
  esac
fi

echo "Stopping services and wiping data volume..."
docker compose -f "$COMPOSE_FILE" down -v

echo "Bringing services back up..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "Done."
echo "Notes:"
echo " - Postgres data was wiped; the indexer will re-ingest from genesis."
echo " - If the UI still shows stale chain info, refresh the browser."
echo "=========================================="
