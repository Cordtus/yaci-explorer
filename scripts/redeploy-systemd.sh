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
export npm_config_package_lock=false

if ! command -v "$YARN_BIN" >/dev/null 2>&1; then
  echo "yarn is required (set YARN_BIN to override lookup)." >&2
  exit 1
fi

INDEXER_SERVICE="${YACI_INDEXER_SERVICE:-yaci-indexer.service}"
POSTGREST_SERVICE="${POSTGREST_SERVICE:-postgrest.service}"
EXPLORER_SERVICE="${YACI_EXPLORER_SERVICE:-yaci-explorer.service}"

if [[ ! -f "${REPO_ROOT}/.env" ]]; then
  echo "[redeploy] No .env found; launching credential helper..."
  "${REPO_ROOT}/scripts/configure-env.sh"
elif [[ "${FORCE_ENV_PROMPTS:-false}" == "true" ]]; then
  echo "[redeploy] FORCE_ENV_PROMPTS=true; re-running credential helper..."
  "${REPO_ROOT}/scripts/configure-env.sh"
else
  echo "[redeploy] Using existing database credentials from .env (set FORCE_ENV_PROMPTS=true to reconfigure)."
fi

echo "[redeploy] Installing dependencies with $YARN_BIN..."
"$YARN_BIN" install

if [[ "${YACI_SKIP_UPDATE:-false}" == "true" ]]; then
  echo "[redeploy] Skipping Yaci indexer update (YACI_SKIP_UPDATE=true)."
else
  echo "[redeploy] Updating Yaci indexer from ${YACI_BRANCH:-main}..."
  "${REPO_ROOT}/scripts/update-yaci.sh"
fi

echo "[redeploy] Running deploy build..."
"$YARN_BIN" deploy:build

echo "[redeploy] Executing full reset guard..."
"$YARN_BIN" reset:full

echo "[redeploy] Restarting systemd services..."
sudo systemctl restart "$INDEXER_SERVICE"
sudo systemctl restart "$POSTGREST_SERVICE"
sudo systemctl restart "$EXPLORER_SERVICE"

echo "[redeploy] Done. Check 'journalctl -u ${INDEXER_SERVICE} -f' for sync progress."
