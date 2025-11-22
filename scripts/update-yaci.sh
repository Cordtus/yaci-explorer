#!/usr/bin/env bash
# Fetches and rebuilds the Yaci indexer binary from the configured repository/branch.
# Intended to run before restarting the yaci-indexer systemd unit on bare-metal installs.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "${YACI_SKIP_UPDATE:-false}" == "true" ]]; then
  echo "[yaci] YACI_SKIP_UPDATE=true, skipping indexer update."
  exit 0
fi

YACI_SOURCE_DIR="${YACI_SOURCE_DIR:-${REPO_ROOT}/../yaci}"
YACI_REPO_URL="${YACI_REPO_URL:-https://github.com/cordtus/yaci.git}"
YACI_BRANCH="${YACI_BRANCH:-main}"
YACI_REMOTE="${YACI_REMOTE:-origin}"
YACI_BUILD_CMD="${YACI_BUILD_CMD:-make build}"

if [[ ! -d "${YACI_SOURCE_DIR}" ]]; then
  echo "[yaci] Cloning ${YACI_REPO_URL} into ${YACI_SOURCE_DIR}..."
  git clone "${YACI_REPO_URL}" "${YACI_SOURCE_DIR}"
fi

cd "${YACI_SOURCE_DIR}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "[yaci] Working tree has uncommitted changes in ${YACI_SOURCE_DIR}." >&2
  echo "[yaci] Commit or stash them before running the update script." >&2
  exit 1
fi

echo "[yaci] Fetching latest ${YACI_BRANCH} from ${YACI_REMOTE}..."
git fetch "${YACI_REMOTE}" "${YACI_BRANCH}"
git checkout "${YACI_BRANCH}"
git pull --ff-only "${YACI_REMOTE}" "${YACI_BRANCH}"

echo "[yaci] Building indexer via '${YACI_BUILD_CMD}'..."
eval "${YACI_BUILD_CMD}"

echo "[yaci] Yaci indexer updated at ${YACI_SOURCE_DIR}/bin/yaci"
