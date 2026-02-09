#FROM node:22-bullseye AS base
FROM --platform=$BUILDPLATFORM node:22-bullseye AS base

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    bash \
    tzdata \
    libc6 \
    build-essential \
    g++ \
    make \
    autoconf \
    automake \
    libtool \
    git \
    nginx \
    && rm -rf /var/lib/apt/lists/*

#FROM base AS tusd-base
#
#ENV TUSD_VERSION=2.8.0
#
#RUN apt-get update && apt-get install -y \
#        curl \
#        ca-certificates \
#        bash \
#        tar \
#        gzip \
#        libssl-dev \
#        && rm -rf /var/lib/apt/lists/*
#
## Download and extract tusd
#RUN curl -L -o /tmp/tusd.tar.gz \
#        https://github.com/tus/tusd/releases/download/v${TUSD_VERSION}/tusd_linux_amd64.tar.gz \
#    && mkdir -p /usr/local/bin \
#    && tar -xzf /tmp/tusd.tar.gz -C /tmp \
#    # Move the actual binary, whatever its name/folder inside tar
#    && mv /tmp/*/tusd /usr/local/bin/tusd \
#    && chmod +x /usr/local/bin/tusd \
#    && /usr/local/bin/tusd --version

# Use Debian-based Go for reliable networking/DNS during build
FROM --platform=$BUILDPLATFORM golang:1.23-bookworm AS tusd-base

ARG TUSD_VERSION=2.8.0

# Install git
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

RUN git clone https://github.com/tus/tusd.git . \
    && git checkout v${TUSD_VERSION}

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH} \
    go build -ldflags="-s -w" -o /tusddist/tusd ./cmd/tusd

# Minimal dist stage (scratch keeps final image small)
FROM scratch AS tusd-dist
COPY --from=tusd-base /tusddist/tusd /tusd



FROM base AS build-env

RUN corepack enable && corepack prepare pnpm@latest --activate

FROM build-env AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm i --frozen-lockfile

FROM build-env AS dev

COPY --from=deps /app/node_modules ./node_modules
COPY --from=tusd-base /usr/local/bin/tusd /usr/local/bin/tusd
WORKDIR /app
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
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/portabase.config.ts ./
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder --chown=1001:1001 /app/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/.next/static ./.next/static
COPY --chown=1001:1001 src/db ./src/db
COPY --from=deps /app/node_modules ./node_modules

#COPY --from=tusd-base /usr/local/bin/tusd /usr/local/bin/tusd
COPY --from=tusd-dist /tusd /usr/local/bin/tusd
RUN chmod +x /usr/local/bin/tusd

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf


RUN mkdir -p .next /app/private/uploads \
    && chown -R nextjs:nodejs .next /app/private /app/public

USER root
COPY ./docker/entrypoints/app-prod-entrypoint.sh /app/app-prod-entrypoint.sh
RUN chmod +x /app/app-prod-entrypoint.sh

EXPOSE 80
#USER nextjs
ENTRYPOINT ["sh","/app/app-prod-entrypoint.sh"]
