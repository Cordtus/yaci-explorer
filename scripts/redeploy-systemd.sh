#!/usr/bin/env bash
# Full redeploy helper for bare-metal/systemd installs.
# Steps:
#   1. bun install
#   2. bun run deploy:build
#   3. systemctl restart services

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v bun >/dev/null 2>&1; then
  echo "[error] bun is required. Install from https://bun.sh" >&2
  exit 1
fi

INDEXER_SERVICE="${YACI_INDEXER_SERVICE:-yaci-indexer.service}"
POSTGREST_SERVICE="${POSTGREST_SERVICE:-postgrest.service}"
EXPLORER_SERVICE="${YACI_EXPLORER_SERVICE:-yaci-explorer.service}"

[[ -f "${REPO_ROOT}/.env" ]] && set -a && source "${REPO_ROOT}/.env" && set +a

if [[ ! -f "${REPO_ROOT}/.env" ]]; then
  echo "[redeploy] No .env found; launching configure-env..."
  "${REPO_ROOT}/scripts/configure-env.sh"
elif [[ "${FORCE_ENV_PROMPTS:-false}" == "true" ]]; then
  echo "[redeploy] FORCE_ENV_PROMPTS=true; re-running configure-env..."
  "${REPO_ROOT}/scripts/configure-env.sh"
fi

echo "[redeploy] Installing dependencies..."
bun install

if [[ "${YACI_SKIP_UPDATE:-false}" != "true" ]]; then
  echo "[redeploy] Updating Yaci indexer..."
  "${REPO_ROOT}/scripts/update-yaci.sh"
fi

echo "[redeploy] Building..."
bun run deploy:build

echo "[redeploy] Restarting services..."
sudo systemctl restart "$INDEXER_SERVICE" "$POSTGREST_SERVICE" "$EXPLORER_SERVICE"

echo "[redeploy] Done. Check 'journalctl -u ${INDEXER_SERVICE} -f' for progress."
