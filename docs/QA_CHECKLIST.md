# SQL-Opti-Viz QA Checklist

Use this checklist before cutting a release or shipping changes.

## 1. Build & smoke tests
- [ ] `make frontend-build`
- [ ] `make backend-build`
- [ ] `make backend-test`
- [ ] `make frontend-test`
- [ ] `docker build -t sql-opti-viz:qa .`

## 2. Manual mode (no database connection)
- [ ] Launch backend (`go run ./backend/cmd/optiviz`).
- [ ] Open http://localhost:8080 and verify the UI loads.
- [ ] Paste the contents of `fixtures/manual_sample.sql` into the SQL editor.
- [ ] Paste `fixtures/manual_explain.json` into the EXPLAIN JSON field.
- [ ] Click **Analyze** and confirm:
  - Explain plan graph renders a sequential scan node.
  - Optimizer suggestions list includes entries for `Seq Scan`, `Leading wildcard`, and `Function on column`.
  - AST explorer renders without errors.
- [ ] Clear EXPLAIN JSON and confirm the Analyze button disables and validation messaging appears.

## 3. Connected mode (requires PostgreSQL test database)
- [ ] Switch to **Connected mode**.
- [ ] Fill connection information (host/user/password/db) for a staging database.
- [ ] Paste `fixtures/manual_sample.sql` into the SQL editor.
- [ ] Run **Analyze** and verify the same outputs as Manual mode.
- [ ] Confirm incorrect credentials raise a top-level error banner.

## 4. UI/UX checks
- [ ] Toggle between modes and ensure form state resets appropriately.
- [ ] Validate input errors highlight fields in red.
- [ ] Resize browser to 375px width and verify layout remains usable.
- [ ] Confirm CORS behaviour by running `npm run dev` and hitting API on port 8080.

## 5. Packaging
- [ ] Run container: `docker run --rm -p 8080:8080 sql-opti-viz:qa`.
- [ ] Repeat Manual mode smoke test inside the containerized environment.
- [ ] Stop container (`Ctrl+C` or `docker stop`).

## 6. Regression checklist
- [ ] Analyzer handles invalid JSON gracefully (toast / inline error).
- [ ] API returns JSON errors with `error` and `details` keys.
- [ ] Health endpoint (`/healthz`) returns `status: ok`.

Check off every item before sign-off.
- [ ] Load schema/data via `./scripts/load-test-data.sh` and verify sample queries run (`RUN_QUERIES=true ./scripts/load-test-data.sh`).
- [ ] Run complex query from `fixtures/test_queries.sql` (join + aggregation) and verify plan shows multiple nodes. Capture JSON (see `fixtures/complex_manual_explain.json`).
