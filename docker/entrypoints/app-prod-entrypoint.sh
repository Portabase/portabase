#!/bin/bash

if [ -n "$TZ" ]; then
    echo "[INFO] Application timezone set to $TZ (environment only)"
    export TZ="$TZ"
else
    echo "[WARN] No TZ provided, using default container timezone"
fi

# Start tusd as background process
mkdir -p /app/private/uploads
echo "▶ Starting tusd server..."
tusd --dir /app/private/uploads --hooks-http http://localhost:80/api/tus/hooks --port 1080 &

node server.js

exec "$@"

