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

  # If running as root, prefer creating the role + database using the postgres
  # superuser over the local socket so we never need a password prompt.
  if [ "$(id -u)" -eq 0 ]; then
    # Build a helper to run psql as the postgres OS user when sudo/runuser are available.
    run_as_postgres() {
      if command -v sudo >/dev/null 2>&1; then
        sudo -u postgres "$@"
      elif command -v runuser >/dev/null 2>&1; then
        runuser -u postgres -- "$@"
      else
        # Fallback: assume we can invoke psql directly as postgres over the local socket.
        "$@"
      fi
    }

    if run_as_postgres psql -d postgres -Atqc "${check_cmd}" >/dev/null 2>&1; then
      return 0
    fi

    echo "Database ${POSTGRES_DB} not found; creating role/user ${POSTGRES_USER} and database via postgres superuser..."

    # Idempotent role + database creation. This ensures a single application user
    # (POSTGRES_USER) owns the explorer database and can log in with POSTGRES_PASSWORD.
    local bootstrap_sql
    bootstrap_sql=$(
      cat <<SQL
DO \$do\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${POSTGRES_USER}') THEN
    CREATE ROLE ${POSTGRES_USER} LOGIN PASSWORD '${POSTGRES_PASSWORD}' CREATEDB;
  END IF;
END
\$do\$;
DO \$do\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '${POSTGRES_DB}') THEN
    CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};
  END IF;
END
\$do\$;
SQL
    )

    if printf '%s\n' "${bootstrap_sql}" | run_as_postgres psql -v ON_ERROR_STOP=1 -d postgres >/dev/null 2>&1; then
      return 0
    fi

    echo "Warning: postgres superuser path failed to create database ${POSTGRES_DB} (or role ${POSTGRES_USER})." >&2
  fi

  # Fallback: try with application user over configured host/port. This will only
  # succeed if the role/database were created by other means (e.g. docker-compose).
  if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U "${POSTGRES_USER}" -d postgres -Atqc "${check_cmd}" >/dev/null 2>&1; then
    return 0
  fi

  echo "Warning: unable to create or verify database ${POSTGRES_DB}; ensure it exists before running the guard." >&2
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
