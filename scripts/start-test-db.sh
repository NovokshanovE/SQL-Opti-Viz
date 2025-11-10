#!/usr/bin/env bash
set -euo pipefail

IMAGE=${POSTGRES_IMAGE:-postgres:15-alpine}
CONTAINER_NAME=${CONTAINER_NAME:-sql-opti-viz-test-db}
HOST_PORT=${HOST_PORT:-55432}
DB_NAME=${DB_NAME:-optiviz}
DB_USER=${DB_USER:-optiviz}
DB_PASSWORD=${DB_PASSWORD:-optiviz}
VOLUME_DIR=${VOLUME_DIR:-$(pwd)/.pgdata}

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run this script" >&2
  exit 1
fi

mkdir -p "${VOLUME_DIR}"

if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  if docker ps --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
    echo "Container ${CONTAINER_NAME} is already running"
  else
    echo "Starting existing container ${CONTAINER_NAME}"
    docker start "${CONTAINER_NAME}"
  fi
else
  echo "Creating new PostgreSQL container ${CONTAINER_NAME}"
  docker run \
    --name "${CONTAINER_NAME}" \
    -e POSTGRES_DB="${DB_NAME}" \
    -e POSTGRES_USER="${DB_USER}" \
    -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
    -v "${VOLUME_DIR}:/var/lib/postgresql/data" \
    -p "${HOST_PORT}:5432" \
    -d "${IMAGE}"
fi

docker ps --filter "name=${CONTAINER_NAME}" --format 'Container {{.Names}} is {{.Status}}'

echo
cat <<INFO
Connection details:
  Connection string: postgres://${DB_USER}:${DB_PASSWORD}@localhost:${HOST_PORT}/${DB_NAME}
  DB name         : ${DB_NAME}
  User            : ${DB_USER}
  Password        : ${DB_PASSWORD}

Stop the database with: docker stop ${CONTAINER_NAME}
Remove it with        : docker rm ${CONTAINER_NAME}
INFO
