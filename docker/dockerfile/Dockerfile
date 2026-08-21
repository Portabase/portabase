FROM node:26.7.0-trixie-slim AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm i --frozen-lockfile

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build


FROM node:26.7.0-trixie-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV PRIVATE_PATH=/data/private

COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/portabase.config.ts ./
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder --chown=1001:1001 /app/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/.next/static ./.next/static
COPY --chown=1001:1001 src/db ./src/db
COPY --chown=1001:1001 docker/entrypoints/app-prod-entrypoint.sh ./docker/entrypoints/app-prod-entrypoint.sh

RUN mkdir -p /data/private \
    && chown -R 1001:1001 /app /data \
    && chmod +x docker/entrypoints/app-prod-entrypoint.sh

USER 1001:1001

EXPOSE 3000

ENTRYPOINT ["docker/entrypoints/app-prod-entrypoint.sh"]