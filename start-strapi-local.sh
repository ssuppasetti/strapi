#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMS_DIR="$SCRIPT_DIR/cms"
ADMIN_URL="${STRAPI_ADMIN_URL:-http://localhost:1337/admin}"

open_admin_browser() {
  /c/Windows/System32/cmd.exe //c start "" "$ADMIN_URL" >/dev/null 2>&1 || true
}

if command -v npm >/dev/null 2>&1; then
  cd "$CMS_DIR"
  open_admin_browser
  exec npm run develop
fi

NPM_CMD="/c/Program Files/nodejs/npm.cmd"
if [ -f "$NPM_CMD" ]; then
  cd "$CMS_DIR"
  open_admin_browser
  exec /c/Windows/System32/cmd.exe //c "set PATH=C:\\Progra~1\\nodejs;%PATH% && C:\\Progra~1\\nodejs\\npm.cmd run develop"
fi

echo "npm not found. Install Node.js LTS and ensure npm is on PATH."
exit 1
