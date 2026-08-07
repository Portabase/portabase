#!/bin/bash

set -euo pipefail

if [ -n "${TZ:-}" ]; then
    echo "[INFO] Application timezone set to $TZ"
else
    echo "[WARN] No TZ provided, using default container timezone"
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "[ERROR] DATABASE_URL is not set"
    exit 1
fi

exec node server.js