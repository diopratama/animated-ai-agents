#!/bin/bash
#
# Run the agent bridge backend inside Docker.
# Mounts ~/.gemini credentials read-write for Google login auth.
#
# Usage:
#   ./run-docker.sh                    # build and start
#   ./run-docker.sh --rebuild          # force rebuild image
#   ./run-docker.sh down               # stop and remove container
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.local.yml"

if [ "$1" = "down" ]; then
    docker compose -f "$COMPOSE_FILE" down
    exit 0
fi

BUILD_FLAG=""
if [ "$1" = "--rebuild" ]; then
    BUILD_FLAG="--build --force-recreate"
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Pixel Agents — Docker Backend               ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Compose: docker-compose.local.yml           ║"
echo "║  URL:     http://localhost:3003               ║"
echo "║  Creds:   ~/.gemini mounted read-write       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

docker compose -f "$COMPOSE_FILE" up $BUILD_FLAG
