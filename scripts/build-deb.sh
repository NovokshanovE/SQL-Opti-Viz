#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
VERSION=${VERSION:-0.1.0}
ARCH=${ARCH:-amd64}
PACKAGE_NAME=sql-opti-viz
BUILD_DIR="$PROJECT_ROOT/dist/${PACKAGE_NAME}_${VERSION}_${ARCH}"
BIN_DIR="$BUILD_DIR/usr/bin"
CONTROL_DIR="$BUILD_DIR/DEBIAN"

banner() {
  echo "\n=== $1 ===\n"
}

rm -rf "$PROJECT_ROOT"/dist/${PACKAGE_NAME}_*
mkdir -p "$BIN_DIR" "$CONTROL_DIR"

banner "Building backend binary"
pushd "$PROJECT_ROOT/backend" >/dev/null
GOOS=linux GOARCH=${ARCH} CGO_ENABLED=1 go build -o "$BIN_DIR/optiviz-server" ./cmd/optiviz
popd >/dev/null

banner "Building CLI binary"
pushd "$PROJECT_ROOT/backend" >/dev/null
GOOS=linux GOARCH=${ARCH} CGO_ENABLED=1 go build -o "$BIN_DIR/optiviz-cli" ./cmd/optiviz-cli
popd >/dev/null

cat > "$CONTROL_DIR/control" <<CONTROL
Package: ${PACKAGE_NAME}
Version: ${VERSION}
Section: utils
Priority: optional
Architecture: ${ARCH}
Maintainer: ${MAINTAINER:-sql-opti-viz <maintainer@example.com>}
Description: SQL Opti Viz server and CLI
 This package installs the optiviz HTTP server and the optiviz-cli tool.
CONTROL

chmod 755 "$CONTROL_DIR"

OUTPUT_DIR="$PROJECT_ROOT/dist"
mkdir -p "$OUTPUT_DIR"

banner "Creating deb package"
dpkg-deb --build "$BUILD_DIR" "$OUTPUT_DIR"

echo "\nDeb package created: $(find "$OUTPUT_DIR" -maxdepth 1 -name '${PACKAGE_NAME}_*.deb' -print)"
