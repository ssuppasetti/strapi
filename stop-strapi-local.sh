#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-1337}"

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:"$PORT" || true)"
else
  PIDS="$(netstat -ano 2>/dev/null | grep ":$PORT" | grep LISTENING | awk '{print $5}' | tr -d '\r' | sort -u || true)"
fi

if [ -z "${PIDS:-}" ]; then
  echo "No process found listening on port $PORT"
  exit 0
fi

for PID in $PIDS; do
  taskkill //PID "$PID" //F >/dev/null 2>&1 || true
  echo "Stopped process PID $PID on port $PORT"
done
