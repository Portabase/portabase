#!/usr/bin/env bash
#
# azurite-list.sh — enumerate every container and blob in a local Azurite emulator.
#
# Usage:
#   ./azurite-list.sh            # list containers + blobs
#   ./azurite-list.sh -v         # also print blob size, last-modified, content-type
#

set -euo pipefail

export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;"

VERBOSE=0
[[ "${1:-}" == "-v" || "${1:-}" == "--verbose" ]] && VERBOSE=1

command -v az >/dev/null 2>&1 || { echo "ERROR: 'az' CLI not found in PATH." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "ERROR: 'jq' not found in PATH." >&2; exit 1; }

if ! az storage container list --num-results 1 >/dev/null 2>&1; then
  echo "ERROR: Cannot reach Azurite at 127.0.0.1:10000. Is the container running?" >&2
  echo "       Start it with: docker start azurite" >&2
  exit 1
fi

containers=$(az storage container list --query "[].name" -o tsv)

if [[ -z "$containers" ]]; then
  echo "(no containers found in this emulator)"
  exit 0
fi

while IFS= read -r container; do
  echo "📦 container: $container"

  if [[ "$VERBOSE" -eq 1 ]]; then
    az storage blob list --container-name "$container" \
      --query "[].{name:name, bytes:properties.contentLength, modified:properties.lastModified, type:properties.contentSettings.contentType}" \
      -o json \
    | jq -r '.[] | "   • \(.name)  [\(.bytes) bytes]  \(.type // "?")  \(.modified)"'
  else
    az storage blob list --container-name "$container" \
      --query "[].{name:name, bytes:properties.contentLength}" \
      -o json \
    | jq -r '.[] | "   • \(.name)  [\(.bytes) bytes]"'
  fi

  count=$(az storage blob list --container-name "$container" --query "length(@)" -o tsv)
  [[ "$count" -eq 0 ]] && echo "   (empty)"
  echo
done <<< "$containers"