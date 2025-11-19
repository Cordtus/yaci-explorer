#!/usr/bin/env bash
# Interactive helper to keep database credentials consistent across docker/bare-metal flows.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
AUTO_ACCEPT=false

usage() {
  cat <<'EOF'
Usage: configure-env.sh [--yes]

Prompts for PostgreSQL username/password/database and rewrites .env (creating it from
.env.example if needed). Use --yes to accept the current/default values without prompting.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -y|--yes)
      AUTO_ACCEPT=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! command -v python3 >/dev/null 2>&1; then
  echo "[configure-env] python3 is required." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[configure-env] No .env found; copying from .env.example"
  cp "${REPO_ROOT}/.env.example" "$ENV_FILE"
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

current_user="${POSTGRES_USER:-yaci}"
current_password="${POSTGRES_PASSWORD:-changeme}"
current_db="${POSTGRES_DB:-yaci}"
current_host="${POSTGRES_HOST:-localhost}"
current_port="${POSTGRES_PORT:-5432}"

prompt_value() {
  local label="$1"
  local current="$2"
  local secret="${3:-false}"
  local value

  if [[ "$AUTO_ACCEPT" == "true" ]]; then
    printf '%s' "$current"
    return
  fi

  if [[ "$secret" == "true" ]]; then
    read -rsp "$label [$([ -n "$current" ] && printf '%s' "$current" || printf '(none)')]: " value
    echo
  else
    read -rp "$label [$([ -n "$current" ] && printf '%s' "$current" || printf '(none)')]: " value
  fi

  if [[ -z "$value" ]]; then
    printf '%s' "$current"
  else
    printf '%s' "$value"
  fi
}

pg_user="$(prompt_value 'Postgres username' "$current_user")"
pg_password="$(prompt_value 'Postgres password' "$current_password" true)"
pg_db="$(prompt_value 'Postgres database' "$current_db")"

db_uri="postgres://${pg_user}:${pg_password}@${current_host}:${current_port}/${pg_db}"

python3 - <<'PY' "$ENV_FILE" "$pg_user" "$pg_password" "$pg_db" "$db_uri"
import pathlib, sys
env_path = pathlib.Path(sys.argv[1])
updates = {
    "POSTGRES_USER": sys.argv[2],
    "POSTGRES_PASSWORD": sys.argv[3],
    "POSTGRES_DB": sys.argv[4],
    "RESET_GUARD_DB_URI": sys.argv[5],
}
lines = env_path.read_text().splitlines()
seen = set()
for idx, line in enumerate(lines):
    if "=" not in line or line.lstrip().startswith("#"):
        continue
    key, _ = line.split("=", 1)
    key = key.strip()
    if key in updates:
        lines[idx] = f"{key}={updates[key]}"
        seen.add(key)
remaining = [f"{k}={v}" for k, v in updates.items() if k not in seen]
if remaining:
    if lines and lines[-1].strip():
        lines.append("")
    lines.extend(remaining)
env_path.write_text("\n".join(lines) + "\n")
PY

echo "[configure-env] Updated .env with:"
echo "  POSTGRES_USER=$pg_user"
echo "  POSTGRES_DB=$pg_db"
echo "  POSTGRES_PASSWORD=<hidden>"
echo "  RESET_GUARD_DB_URI=$db_uri"
