#!/bin/bash

if [ -n "$TZ" ]; then
    echo "[INFO] Application timezone set to $TZ (environment only)"
    export TZ="$TZ"
else
    echo "[WARN] No TZ provided, using default container timezone"
fi

pnpm run start
#node server.js

exec "$@"

