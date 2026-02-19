#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMS_DIR="$SCRIPT_DIR/cms"

if command -v npm >/dev/null 2>&1; then
  cd "$CMS_DIR"
  exec npm run develop
fi

NPM_CMD="/c/Program Files/nodejs/npm.cmd"
if [ -f "$NPM_CMD" ]; then
  cd "$CMS_DIR"
  exec /c/Windows/System32/cmd.exe //c "\"C:\\Program Files\\nodejs\\npm.cmd\" run develop"
fi

echo "npm not found. Install Node.js LTS and ensure npm is on PATH."
exit 1
