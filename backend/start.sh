#!/bin/bash
set -e

# BeautyDonusum Backend – Production Startup Script

echo "==> Starting BeautyDonusum Backend..."

# Validate required environment variables
REQUIRED_VARS=("MONGO_URL" "JWT_SECRET" "ADMIN_EMAIL" "ADMIN_PASSWORD")
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: Required environment variable '$var' is not set."
    exit 1
  fi
done

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
WORKERS="${WORKERS:-1}"

echo "==> Host: $HOST  Port: $PORT  Workers: $WORKERS"

exec uvicorn server:app \
  --host "$HOST" \
  --port "$PORT" \
  --workers "$WORKERS" \
  --log-level info
