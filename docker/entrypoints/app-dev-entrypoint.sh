#!/bin/bash

set -euo pipefail

echo "▶ Running Drizzle codegen..."
pnpm drizzle-kit generate

echo "▶ Applying migrations..."
pnpm drizzle-kit migrate

echo "▶ Starting Next.js dev server..."
exec pnpm dev