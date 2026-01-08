#!/usr/bin/env bash
# Deployment script for yaci-explorer frontend
# Usage: ./scripts/deploy.sh [install|build|start|stop|status]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
INSTALL_DIR="${INSTALL_DIR:-/opt/yaci-explorer}"
SERVICE_NAME="yaci-explorer"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[i]${NC} $1"; }
success() { echo -e "${GREEN}[+]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; exit 1; }

check_bun() {
  if ! command -v bun >/dev/null 2>&1; then
    error "bun is required. Install from https://bun.sh"
  fi
}

cmd_install() {
  info "Installing yaci-explorer to ${INSTALL_DIR}..."

  check_bun

  # Create install directory
  mkdir -p "$INSTALL_DIR"

  # Copy files
  info "Copying files..."
  cp -r "$REPO_ROOT"/{dist,public,package.json,bun.lock} "$INSTALL_DIR/" 2>/dev/null || true

  # Install systemd service
  info "Installing systemd service..."
  cat > /etc/systemd/system/yaci-explorer.service << EOF
[Unit]
Description=Yaci Explorer Frontend
After=network.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/local/bin/bun serve ./dist --port 3001
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable "$SERVICE_NAME"

  success "Installation complete"
  echo ""
  echo "Next steps:"
  echo "  1. Edit ${INSTALL_DIR}/dist/config.json with your API URL"
  echo "  2. Start the service: systemctl start $SERVICE_NAME"
  echo "  3. Configure Caddy to reverse proxy to localhost:3001"
}

cmd_build() {
  info "Building frontend..."
  check_bun
  cd "$REPO_ROOT"
  bun install
  bun run build
  success "Build complete (output in dist/)"
}

cmd_start() {
  info "Starting $SERVICE_NAME..."
  systemctl start "$SERVICE_NAME"
  systemctl status "$SERVICE_NAME" --no-pager
}

cmd_stop() {
  info "Stopping $SERVICE_NAME..."
  systemctl stop "$SERVICE_NAME"
}

cmd_status() {
  systemctl status "$SERVICE_NAME" --no-pager || true
  echo ""
  journalctl -u "$SERVICE_NAME" -n 20 --no-pager
}

cmd_logs() {
  journalctl -u "$SERVICE_NAME" -f
}

case "${1:-help}" in
  install) cmd_install ;;
  build) cmd_build ;;
  start) cmd_start ;;
  stop) cmd_stop ;;
  status) cmd_status ;;
  logs) cmd_logs ;;
  *)
    echo "Usage: $0 {install|build|start|stop|status|logs}"
    echo ""
    echo "Commands:"
    echo "  build    Build the frontend (bun run build)"
    echo "  install  Install to ${INSTALL_DIR} and setup systemd service"
    echo "  start    Start the systemd service"
    echo "  stop     Stop the systemd service"
    echo "  status   Show service status and recent logs"
    echo "  logs     Follow service logs"
    ;;
esac
