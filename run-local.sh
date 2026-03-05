#!/bin/bash
#
# Run the agent bridge backend directly on Mac (no Docker).
# Gemini CLI must be installed and authenticated on this machine.
#
# Usage:
#   ./run-local.sh                     # defaults: port 3003, google_login auth
#   PORT=4000 ./run-local.sh           # custom port
#   GEMINI_AUTH_MODE=api_key GEMINI_API_KEY=xxx ./run-local.sh   # API key mode
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

export PORT="${PORT:-3003}"
export PROJECT_ROOT="$SCRIPT_DIR"
export GEMINI_AUTH_MODE="${GEMINI_AUTH_MODE:-google_login}"
export GEMINI_CMD="${GEMINI_CMD:-gemini}"

# Verify Gemini CLI is available
if ! command -v "$GEMINI_CMD" &>/dev/null; then
    echo "ERROR: '$GEMINI_CMD' not found in PATH."
    echo "Install it:  npm install -g @google/gemini-cli"
    echo "Or set GEMINI_CMD to the full path."
    exit 1
fi

cd "$SCRIPT_DIR/backend"

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Pixel Agents — Local Mac Backend            ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  URL:   http://localhost:$PORT               "
echo "║  Root:  $PROJECT_ROOT"
echo "║  Auth:  $GEMINI_AUTH_MODE"
echo "║  CLI:   $(command -v "$GEMINI_CMD")"
echo "╚══════════════════════════════════════════════╝"
echo ""

exec node server.js
