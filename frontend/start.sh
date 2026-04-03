#!/bin/bash
set -e

echo "==> Starting BeautyDonusum Frontend..."

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8081}"

echo "==> Host: $HOST  Port: $PORT"

exec npx expo start --web --port "$PORT" --host "$HOST" --non-interactive
