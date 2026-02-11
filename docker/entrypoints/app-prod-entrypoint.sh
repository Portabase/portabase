#!/bin/bash

if [ -n "$TZ" ]; then
    echo "[INFO] Application timezone set to $TZ (environment only)"
    export TZ="$TZ"
else
    echo "[WARN] No TZ provided, using default container timezone"
fi

mkdir -p /app/private/uploads/tmp
echo "▶ Starting tusd server..."
tusd --base-path /tus/files/ --upload-dir /app/private/uploads/tmp --hooks-http http://127.0.0.1:3000/api/tus/hooks --port 1080 --max-size 21474836480 &

echo "▶ Starting Next.js server..."
PORT=3000 node server.js &

echo "▶ Starting nginx..."
exec nginx -g "daemon off;"


