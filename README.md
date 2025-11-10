# SQL-Opti-Viz

SQL-Opti-Viz is a self-hosted tool that helps engineers understand and optimize PostgreSQL queries without sending data to third-party services. It parses SQL statements, visualizes EXPLAIN (FORMAT JSON) plans, exposes the parsed AST, and runs a rule-based optimizer to produce actionable tuning suggestions.

## Features
- **Dual acquisition modes**
  - *Connected*: the backend connects to a target PostgreSQL instance, executes `EXPLAIN (FORMAT JSON, COSTS, ANALYZE, BUFFERS)`, and runs analysis.
  - *Manual*: paste a SQL statement and the JSON output from `EXPLAIN` to analyze fully offline.
- **Visualizations**: interactive explain-plan graph, AST explorer, and structured optimizer suggestions.
- **Security-first**: runs entirely on-premises; Docker image bundles the Go backend and React frontend.
- **Rule engine**: initial rules detect sequential scans, leading wildcards in `LIKE` predicates, and functions applied to indexed columns.

## Project structure
```
backend/            Go API + analyzer + embedded static assets
frontend/           React application (Vite + TypeScript)
backend/ui/build/   Bundled frontend assets used by go:embed
Dockerfile          Multi-stage build producing a single runtime image
Makefile            Common dev/build/test shortcuts
```

## Prerequisites
- Go 1.22+
- Node.js 18+
- npm 9+
- Docker (optional, for container builds)

## Development workflow

### Install dependencies
```bash
make frontend-install
```

### Build the frontend & backend
```bash
make frontend-build
make backend-build
```

`make frontend-build` copies the optimized bundle into `backend/ui/build` so the Go binary can embed the UI.

### Run the server locally
```bash
cd backend
GO_ENV=development go run ./cmd/optiviz
```

Open http://localhost:8080 to access the UI. During React development, you can run `npm run dev` in `frontend/` and rely on the CORS-enabled API served from port 8080.

### Testing & linting
```bash
make backend-test      # go test ./...
make frontend-test     # vitest in run mode
make lint              # go vet + npm run lint
make fmt               # gofmt over backend sources
```

## API reference
### `POST /api/analyze`
Request body (Connected mode):
```json
{
  "mode": "connected",
  "connection_string": "postgres://user:pass@host:5432/db",
  "query": "SELECT * FROM users WHERE age > 20;"
}
```

Request body (Manual mode):
```json
{
  "mode": "manual",
  "query": "SELECT * FROM users WHERE age > 20;",
  "explain_json": { "Plan": { "Node Type": "Seq Scan", ... } }
}
```

Successful response:
```json
{
  "ast": { ... },
  "explain_plan": { ... },
  "suggestions": [
    {
      "title": "Sequential scan detected",
      "description": "The query plan uses a sequential scan on 'users'.",
      "recommendation": "Consider adding an index on the filtered columns.",
      "severity": "High"
    }
  ]
}
```

Errors return `{ "error": "...", "details": "..." }` with appropriate HTTP status codes.

## Docker build & run
```bash
docker build -t sql-opti-viz:latest .
docker run --rm -p 8080:8080 --name sql-opti-viz sql-opti-viz:latest
```
Navigate to http://localhost:8080 after the container starts. Set environment variables such as `PORT` or `ALLOW_ORIGINS` to customize runtime behavior.

## Configuration
Environment variables consumed by the server:

| Variable        | Description                                                        | Default        |
|-----------------|--------------------------------------------------------------------|----------------|
| `PORT`          | Port to bind the HTTP server                                      | `8080`         |
| `ALLOW_ORIGINS` | Comma-separated list of origins allowed via CORS (dev convenience) | *(disabled)*   |
| `GIN_MODE`      | Set to `release` to disable Gin debug logging                      | *(gin default)*|
| `STATIC_DIR`    | Override embedded UI with assets served from this directory        | *(embedded)*   |

## Roadmap
- Expand rule engine coverage (index usage heuristics, join order hints).
- Add persistence for saved analyses & reports.
- Support additional databases (MySQL, SQL Server) beyond PostgreSQL.


### Start a local PostgreSQL test database
A helper script spins up a disposable PostgreSQL instance via Docker:

```bash
./scripts/start-test-db.sh
```

Environment variables you can override:

| Variable         | Default value          | Description                      |
|------------------|------------------------|----------------------------------|
| `HOST_PORT`      | `55432`                | Host port exposed by container   |
| `DB_NAME`        | `optiviz`              | Database name created on boot    |
| `DB_USER`        | `optiviz`              | Username for connections         |
| `DB_PASSWORD`    | `optiviz`              | Password for the user            |
| `CONTAINER_NAME` | `sql-opti-viz-test-db` | Docker container name            |
| `POSTGRES_IMAGE` | `postgres:15-alpine`   | Image tag used for the database  |
| `VOLUME_DIR`     | `./.pgdata`            | Host directory for persisted data |

Stop the container with `docker stop sql-opti-viz-test-db`; remove it with `docker rm sql-opti-viz-test-db` if you no longer need the data volume.

### Load test schema and sample data
With the database running, apply the schema and seed data:

```bash
./scripts/load-test-data.sh
```

Optional environment variables:

| Variable        | Default connection                                   |
|-----------------|-------------------------------------------------------|
| `DATABASE_URL`  | `postgres://optiviz:optiviz@localhost:55432/optiviz`  |
| `SCHEMA_FILE`   | `fixtures/test_schema.sql`                            |
| `QUERIES_FILE`  | `fixtures/test_queries.sql`                           |
| `RUN_QUERIES`   | `false` (set to `true` to execute EXPLAIN statements) |

Sample EXPLAIN statements that exercise the rule engine are stored in `fixtures/test_queries.sql`. Run them manually or set `RUN_QUERIES=true` when invoking the loader script to capture EXPLAIN JSON for Manual mode testing.

### Sample complex analysis
To stress the visualization and rule engine, use the final query in `fixtures/test_queries.sql` (join + aggregation). For Manual mode, a ready-made explain JSON is available at `fixtures/complex_manual_explain.json` (generated with `ANALYZE`, `BUFFERS`).

### One-step bootstrap
To build the images and launch both backend (API) and frontend (UI) containers, run:

```bash
./scripts/bootstrap.sh
```

Environment overrides:

| Variable                   | Default                        | Description                                                         |
|----------------------------|--------------------------------|---------------------------------------------------------------------|
| `API_PORT`                 | `8080`                         | Host port exposed for the Go backend API                            |
| `FRONTEND_PORT`            | `3030`                         | Host port exposed for the React frontend                            |
| `BACKEND_CONTAINER_NAME`   | `sql-opti-viz-backend`         | Name of the backend container                                       |
| `FRONTEND_CONTAINER_NAME`  | `sql-opti-viz-frontend`        | Name of the frontend container                                      |
| `BACKEND_IMAGE_NAME`       | `sql-opti-viz-backend:latest`  | Image tag for the backend build                                     |
| `FRONTEND_IMAGE_NAME`      | `sql-opti-viz-frontend:latest` | Image tag for the frontend build                                    |
| `BACKEND_IMAGE_NAME`       | `sql-opti-viz-backend:latest`  | Image tag for the backend build                                     |
| `FRONTEND_IMAGE_NAME`      | `sql-opti-viz-frontend:latest` | Image tag for the frontend build                                    |

After the script finishes, the frontend is available at `http://localhost:${FRONTEND_PORT}` (default `3030`) and the backend API at `http://localhost:${API_PORT}` (default `8080`).

### CLI usage

The CLI (`optiviz-cli`) lets you run analysis without the web UI.

Manual mode:

```bash
optiviz-cli \
  --mode manual \
  --sql fixtures/manual_sample.sql \
  --explain fixtures/manual_explain.json \
  --format text \
  --print-plan --print-ast
```

Connected mode (requires the database to be reachable):

```bash
optiviz-cli \
  --mode connected \
  --sql fixtures/manual_sample.sql \
  --conn "postgres://user:pass@host:5432/dbname" \
  --format json
```

Flags `--print-plan` and `--print-ast` render ASCII trees (use `--ast-depth N` to limit the AST depth). Use `--sql -` to read SQL from stdin. By default the CLI prints JSON; add `--format text` for a human-readable summary.
