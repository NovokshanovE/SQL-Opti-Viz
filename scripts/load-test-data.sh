#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL=${DATABASE_URL:-postgres://optiviz:optiviz@localhost:55432/optiviz}
SCHEMA_FILE=${SCHEMA_FILE:-$(dirname "$0")/../fixtures/test_schema.sql}
QUERIES_FILE=${QUERIES_FILE:-$(dirname "$0")/../fixtures/test_queries.sql}
RUN_QUERIES=${RUN_QUERIES:-false}

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to load test data" >&2
  exit 1
fi

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Schema file not found: $SCHEMA_FILE" >&2
  exit 1
fi

echo "Applying schema from $SCHEMA_FILE"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"

echo "Seed data applied successfully."

echo "Test queries available at: $QUERIES_FILE"

if [ "$RUN_QUERIES" = "true" ]; then
  if [ ! -f "$QUERIES_FILE" ]; then
    echo "Queries file not found: $QUERIES_FILE" >&2
    exit 1
  fi
  echo "Running sample EXPLAIN statements..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$QUERIES_FILE"
fi

echo
cat <<INFO
Next steps:
  • Manual mode: copy SQL from fixtures/manual_sample.sql and EXPLAIN JSON from fixtures/manual_explain.json.
  • Connected mode: run ./scripts/start-test-db.sh, then ./scripts/load-test-data.sh.
  • To execute sample EXPLAINs: RUN_QUERIES=true ./scripts/load-test-data.sh
INFO
