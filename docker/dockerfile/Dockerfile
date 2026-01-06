FROM node:22-alpine AS base

RUN apk add --update --no-cache \
    libc6-compat \
    openssl \
    tzdata

FROM base AS build-env

RUN apk add --update --no-cache \
    build-base \
    g++ \
    make \
    libtool \
    autoconf \
    automake

RUN corepack enable && corepack prepare pnpm@latest --activate




FROM build-env AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm i --frozen-lockfile




FROM build-env AS dev

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER root

RUN chmod +x /app/docker/entrypoints/app-dev-entrypoint.sh
ENTRYPOINT ["sh","/app/docker/entrypoints/app-dev-entrypoint.sh"]






FROM build-env AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build






FROM base AS prod

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next
RUN mkdir -p /app/private/uploads
RUN chown -R nextjs:nodejs /app/private
RUN chown -R nextjs:nodejs /app/public


COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/portabase.config.ts ./
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs src/db ./src/db

USER root

COPY ./docker/entrypoints/app-prod-entrypoint.sh /app/app-prod-entrypoint.sh
RUN chmod +x /app/app-prod-entrypoint.sh

EXPOSE 80

ENV PORT=80

ENV HOSTNAME="0.0.0.0"

USER nextjs

ENTRYPOINT ["sh","/app/app-prod-entrypoint.sh"]
