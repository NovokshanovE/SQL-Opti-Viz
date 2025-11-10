FROM golang:1.25-alpine AS backend-builder

RUN apk add --no-cache build-base

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod tidy

COPY . .
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -o /optiviz-server ./cmd/optiviz

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates libstdc++
COPY --from=backend-builder /optiviz-server /app/optiviz-server

EXPOSE 8080
ENV PORT=8080
CMD ["/app/optiviz-server"]
