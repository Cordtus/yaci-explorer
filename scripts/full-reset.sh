#!/usr/bin/env bash
# Runs the full reset guard locally without docker-compose.
# 1. Loads variables from .env (if present)
# 2. Ensures sensible defaults for bare-metal deployments
# 3. Executes the chain reset guard which truncates index tables when needed

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "${REPO_ROOT}/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "${REPO_ROOT}/.env" && set +a
fi

# Enable the guard explicitly for bare-metal use
export ENABLE_CHAIN_RESET_GUARD="${ENABLE_CHAIN_RESET_GUARD:-true}"

# Provide defaults for local Postgres hosts (docker script defaulted to "postgres")
export POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export POSTGRES_USER="${POSTGRES_USER:-postgres}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-foobar}"
export POSTGRES_DB="${POSTGRES_DB:-yaci}"

if [[ -z "${CHAIN_RPC_ENDPOINT:-}" && -z "${RESET_GUARD_RPC_ENDPOINT:-}" ]]; then
  echo "CHAIN_RPC_ENDPOINT (or RESET_GUARD_RPC_ENDPOINT) must be set before running the reset guard." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required on PATH to truncate the index tables." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required on PATH to parse RPC responses." >&2
  exit 1
fi

echo "Running chain reset guard (RPC: ${RESET_GUARD_RPC_ENDPOINT:-${CHAIN_RPC_ENDPOINT}})..."
"${REPO_ROOT}/scripts/chain-reset-guard.sh"
echo "Reset guard completed. Restart the Yaci indexer to re-ingest from the chain."
