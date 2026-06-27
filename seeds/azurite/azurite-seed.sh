#!/usr/bin/env bash
#
# azurite-seed.sh — seed a local Azurite emulator with a container + sample blob.
#
# Usage:
#   ./azurite-seed.sh                 # create container "portabase" + sample blob
#   ./azurite-seed.sh my-container    # override container name
#

set -euo pipefail

export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;"

CONTAINER="${1:-portabase}"
BLOB_NAME="hello.txt"

command -v az >/dev/null 2>&1 || { echo "ERROR: 'az' CLI not found in PATH." >&2; exit 1; }

# Reachability check — surface the real az error instead of guessing "container down".
if ! err=$(az storage container list --num-results 1 2>&1 >/dev/null); then
  echo "ERROR: Azurite query failed:" >&2
  printf '%s\n' "$err" | sed 's/^/       /' >&2
  echo "       Is Azurite up? Start it with: docker compose up -d azurite" >&2
  exit 1
fi

# Create container (idempotent — az returns created:false if it already exists).
az storage container create --name "$CONTAINER" -o none
echo "📦 container ready: $CONTAINER"

# Upload a sample blob from a temp file.
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
printf 'hello from azurite seed — %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$tmp"

az storage blob upload \
  --container-name "$CONTAINER" \
  --name "$BLOB_NAME" \
  --file "$tmp" \
  --overwrite true \
  --no-progress \
  -o none
echo "   • uploaded blob: $BLOB_NAME"

echo
echo "Seed complete. Verify with: make list-blob"
