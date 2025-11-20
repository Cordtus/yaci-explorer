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
export POSTGRES_USER="${POSTGRES_USER:-yaci}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-changeme}"
export POSTGRES_DB="${POSTGRES_DB:-yaci}"
export POSTGRES_SUPERUSER="${POSTGRES_SUPERUSER:-postgres}"
export POSTGRES_SUPERPASS="${POSTGRES_SUPERPASS:-}"

if [[ -z "${CHAIN_RPC_ENDPOINT:-}" && -z "${RESET_GUARD_RPC_ENDPOINT:-}" ]]; then
  echo "CHAIN_RPC_ENDPOINT (or RESET_GUARD_RPC_ENDPOINT) must be set before running the reset guard." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required on PATH to truncate the index tables." >&2
  exit 1
fi

ensure_database() {
  local check_cmd="SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'"

  if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres -Atqc "SELECT 1" >/dev/null 2>&1; then
    DB_EXISTS=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres -Atqc "${check_cmd}")
    if [[ -z "${DB_EXISTS}" ]]; then
      echo "Database ${POSTGRES_DB} not found on ${POSTGRES_HOST}:${POSTGRES_PORT}; attempting to create with ${POSTGRES_USER}..."
      if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB}" >/dev/null 2>&1; then
        echo "Failed to create database with provided credentials."
        return 1
      fi
    fi
    return 0
  fi

  if [[ -n "${POSTGRES_SUPERPASS:-}" ]]; then
    DB_EXISTS=$(PGPASSWORD="${POSTGRES_SUPERPASS}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_SUPERUSER}" -d postgres -Atqc "${check_cmd}" 2>/dev/null || true)
    if [[ -z "${DB_EXISTS}" ]]; then
      echo "Database ${POSTGRES_DB} not found; creating via ${POSTGRES_SUPERUSER}..."
      PGPASSWORD="${POSTGRES_SUPERPASS}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_SUPERUSER}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB}" >/dev/null
      PGPASSWORD="${POSTGRES_SUPERPASS}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_SUPERUSER}" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};" >/dev/null || true
    fi
    return 0
  fi

  if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1; then
    DB_EXISTS=$(sudo -u "${POSTGRES_SUPERUSER:-postgres}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -d postgres -Atqc "${check_cmd}" 2>/dev/null || true)
    if [[ -z "${DB_EXISTS}" ]]; then
      echo "Database ${POSTGRES_DB} not found; creating via sudo -u ${POSTGRES_SUPERUSER:-postgres}..."
      sudo -u "${POSTGRES_SUPERUSER:-postgres}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB}" >/dev/null
      sudo -u "${POSTGRES_SUPERUSER:-postgres}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};" >/dev/null || true
    fi
    return 0
  fi

  echo "Warning: unable to connect to postgres to create ${POSTGRES_DB}. Skipping existence check; ensure it exists before running the guard." >&2
  return 1
}

ensure_database || true

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required on PATH to parse RPC responses." >&2
  exit 1
fi

echo "Running chain reset guard (RPC: ${RESET_GUARD_RPC_ENDPOINT:-${CHAIN_RPC_ENDPOINT}})..."
"${REPO_ROOT}/scripts/chain-reset-guard.sh"
echo "Reset guard completed. Restart the Yaci indexer to re-ingest from the chain."
