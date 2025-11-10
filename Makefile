SHELL := /bin/bash

.PHONY: backend-build backend-test frontend-install frontend-build frontend-test lint fmt docker-build clean

backend-build:
	cd backend && go build ./...

backend-test:
	cd backend && go test ./...

frontend-install:
	cd frontend && npm ci

frontend-build: frontend-install
	cd frontend && npm run build

frontend-test:
	cd frontend && npm run test -- --run

lint:
	cd backend && go vet ./...
	cd frontend && npm run lint

fmt:
	find backend -type f -name '*.go' -not -path '*/vendor/*' -print0 | xargs -0 gofmt -w

docker-build:
	docker build -t sql-opti-viz:latest .

clean:
	rm -rf frontend/build backend/ui/build
