#!/usr/bin/env sh
# Runs before the indexer starts to detect chain restarts.
# Requires ENABLE_CHAIN_RESET_GUARD=true and an RPC endpoint.

set -eu

log() {
  printf '[reset-guard] %s\n' "$*"
}

ensure_database() {
  if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname='${PGDATABASE}'" >/dev/null 2>&1; then
    return 0
  fi

  log "Database ${PGDATABASE} not found on ${PGHOST}:${PGPORT}; attempting to create..."
  if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "CREATE DATABASE ${PGDATABASE}" >/dev/null 2>&1; then
    log "Created database ${PGDATABASE}."
    return 0
  fi

  if [ "$(id -u)" -eq 0 ] && command -v runuser >/dev/null 2>&1; then
    if runuser -u postgres -- psql -h "$PGHOST" -p "$PGPORT" -d postgres -c "CREATE DATABASE ${PGDATABASE}" >/dev/null 2>&1; then
      log "Created database ${PGDATABASE} via postgres superuser."
      runuser -u postgres -- psql -h "$PGHOST" -p "$PGPORT" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${PGDATABASE} TO ${PGUSER};" >/dev/null || true
      return 0
    fi
  fi

  log "Failed to create database ${PGDATABASE}; ensure the provided credentials (or root access) can create databases."
}

if [ "${ENABLE_CHAIN_RESET_GUARD:-false}" != "true" ]; then
  log "Guard disabled; exiting."
  exit 0
fi

RPC_ENDPOINT="${RESET_GUARD_RPC_ENDPOINT:-${CHAIN_RPC_ENDPOINT:-}}"
if [ -z "$RPC_ENDPOINT" ]; then
  log "RPC endpoint not provided (set CHAIN_RPC_ENDPOINT or RESET_GUARD_RPC_ENDPOINT)."
  exit 0
fi

DB_URI="${RESET_GUARD_DB_URI:-}"
NEEDS_DB_BOOTSTRAP=0
if [ -z "$DB_URI" ]; then
  PGHOST="${POSTGRES_HOST:-postgres}"
  PGUSER="${POSTGRES_USER:-yaci}"
  PGPASSWORD="${POSTGRES_PASSWORD:-changeme}"
  PGDATABASE="${POSTGRES_DB:-yaci}"
  PGPORT="${POSTGRES_PORT:-5432}"
  DB_URI="postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"
  NEEDS_DB_BOOTSTRAP=1
fi

# Install dependencies if missing (for alpine busybox envs)
if command -v apk >/dev/null 2>&1; then
  apk add --no-cache curl jq postgresql-client >/dev/null 2>&1
fi
if ! command -v jq >/dev/null 2>&1; then
  log "jq is required inside the guard container."
  exit 0
fi
if ! command -v psql >/dev/null 2>&1; then
  log "psql client is required inside the guard container."
  exit 0
fi

if [ "$NEEDS_DB_BOOTSTRAP" -eq 1 ]; then
  ensure_database
fi

RPC_BASE="${RPC_ENDPOINT%/}"

fetch_rpc() {
  path="$1"
  if ! response=$(curl -fsS "${RPC_BASE}${path}"); then
    log "Failed to query RPC endpoint at ${RPC_BASE}${path}"
    exit 0
  fi
  printf '%s' "$response"
}

block_one_json=$(fetch_rpc "/block?height=1")
status_json=$(fetch_rpc "/status")

remote_genesis_hash=$(echo "$block_one_json" | jq -r '.result.block_id.hash // empty')
remote_chain_id=$(echo "$block_one_json" | jq -r '.result.block.header.chain_id // empty')
remote_height=$(echo "$status_json" | jq -r '.result.sync_info.latest_block_height // "0"' | tr -d '"')
remote_height=${remote_height:-0}

if [ -z "$remote_genesis_hash" ] || [ -z "$remote_chain_id" ]; then
  log "Could not determine remote genesis hash or chain ID."
  exit 0
fi

db_max_height=$(psql "$DB_URI" -At -c "SELECT COALESCE(MAX(id),0) FROM api.blocks_raw;")
db_max_height=${db_max_height:-0}
db_fingerprint=$(psql "$DB_URI" -At -F '|' -c "SELECT COALESCE(data->'block_id'->>'hash','') AS hash, COALESCE(data->'block'->'header'->>'chain_id','') AS chain_id FROM api.blocks_raw WHERE id=1;")
db_hash=$(echo "$db_fingerprint" | cut -d '|' -f 1)
db_chain_id=$(echo "$db_fingerprint" | cut -d '|' -f 2)

needs_reset=0
if [ -n "$db_hash" ] && [ "$db_hash" != "$remote_genesis_hash" ]; then
  log "Genesis hash mismatch detected (DB: $db_hash, Chain: $remote_genesis_hash)."
  needs_reset=1
fi
if [ -n "$db_chain_id" ] && [ "$db_chain_id" != "$remote_chain_id" ]; then
  log "Chain ID mismatch detected (DB: $db_chain_id, Chain: $remote_chain_id)."
  needs_reset=1
fi
if [ "$db_max_height" -gt "$remote_height" ]; then
  log "Database height ($db_max_height) ahead of remote height ($remote_height)."
  needs_reset=1
fi

if [ "$needs_reset" -eq 0 ]; then
  log "No reset required."
  exit 0
fi

if [ "${RESET_GUARD_AUTO_TRUNCATE:-true}" = "true" ]; then
  log "Resetting index tables..."
  psql "$DB_URI" <<'SQL'
  TRUNCATE
    api.blocks_raw,
    api.transactions_main,
    api.transactions_raw,
    api.messages_main,
    api.events_main
  RESTART IDENTITY CASCADE;
SQL
  log "Tables truncated. Indexer will re-ingest from genesis."
  exit 0
fi

log "Reset required but RESET_GUARD_AUTO_TRUNCATE is disabled."
log "Truncate tables manually before restarting the indexer."
exit 1
