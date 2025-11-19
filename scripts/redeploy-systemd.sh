#!/usr/bin/env bash
# Full redeploy helper for bare-metal/systemd installs.
# Steps:
#   1. yarn install
#   2. yarn deploy:build (clean + typecheck + build)
#   3. yarn reset:full (runs chain-reset-guard)
#   4. systemctl restart <services>

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

YARN_BIN="${YARN_BIN:-yarn}"

if ! command -v "$YARN_BIN" >/dev/null 2>&1; then
  echo "yarn is required (set YARN_BIN to override lookup)." >&2
  exit 1
fi

INDEXER_SERVICE="${YACI_INDEXER_SERVICE:-yaci-indexer.service}"
POSTGREST_SERVICE="${POSTGREST_SERVICE:-postgrest.service}"
EXPLORER_SERVICE="${YACI_EXPLORER_SERVICE:-yaci-explorer.service}"

echo "[redeploy] Installing dependencies with $YARN_BIN..."
"$YARN_BIN" install

echo "[redeploy] Running deploy build..."
"$YARN_BIN" deploy:build

echo "[redeploy] Executing full reset guard..."
"$YARN_BIN" reset:full

echo "[redeploy] Restarting systemd services..."
sudo systemctl restart "$INDEXER_SERVICE"
sudo systemctl restart "$POSTGREST_SERVICE"
sudo systemctl restart "$EXPLORER_SERVICE"

echo "[redeploy] Done. Check 'journalctl -u ${INDEXER_SERVICE} -f' for sync progress."
