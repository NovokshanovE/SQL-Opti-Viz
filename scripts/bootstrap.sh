#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

API_PORT=${API_PORT:-8080}
FRONTEND_PORT=${FRONTEND_PORT:-3030}
BACKEND_CONTAINER_NAME=${BACKEND_CONTAINER_NAME:-sql-opti-viz-backend}
FRONTEND_CONTAINER_NAME=${FRONTEND_CONTAINER_NAME:-sql-opti-viz-frontend}

function require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command '$1' not found in PATH" >&2
    exit 1
  fi
}

function banner() {
  echo "\n=== $1 ===\n"
}

require_cmd docker

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Error: docker compose is required (install Docker Compose v2 or the standalone binary)." >&2
  exit 1
fi

function remove_container() {
  local name=$1
  if docker ps -a --format '{{.Names}}' | grep -qx "$name"; then
    banner "Removing existing container $name"
    docker rm -f "$name" >/dev/null || true
  fi
}

remove_container "$BACKEND_CONTAINER_NAME"
remove_container "$FRONTEND_CONTAINER_NAME"

export API_PORT FRONTEND_PORT BACKEND_CONTAINER_NAME FRONTEND_CONTAINER_NAME

COMPOSE_OPTIONS=(-f "$PROJECT_ROOT/docker-compose.yml")
SERVICES=("backend" "frontend")

banner "Building images and starting containers (${SERVICES[*]})"
"${COMPOSE_CMD[@]}" "${COMPOSE_OPTIONS[@]}" up --build -d "${SERVICES[@]}"

echo "\nBackend API:    http://localhost:${API_PORT}"
echo "Frontend UI:   http://localhost:${FRONTEND_PORT}"
