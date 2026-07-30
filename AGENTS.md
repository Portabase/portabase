# AGENTS.md

## Purpose

This repository contains the Portabase server application: a Next.js 16 app that powers the dashboard, authentication, backup orchestration, notifications, storage integrations, and deployment artifacts for Portabase.

Use this file as the default operating guide for coding agents working in this repo. Prefer repo-specific conventions here over generic habits.
Always use superpowers skills, non-negociable.

Do not commit every AI-related files (AGENTS.md, docs/superpowers/..., etc)

## Working Principles

- Make the smallest change that solves the problem cleanly.
- Follow existing patterns before introducing new abstractions.
- Keep route files thin; place domain logic in `src/features`, `src/db`, or `src/lib`.
- Do not “clean up” naming inconsistencies in unrelated files as drive-by edits. This codebase has a few historical oddities and broad renames can be risky.
- Never commit secrets, seed exports, or `.env` changes unless the user explicitly asks.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript with `strict: true`
- Drizzle ORM with PostgreSQL
- Better Auth
- TanStack Query
- Zod
- Tailwind CSS 4
- Radix UI / shadcn-style UI primitives
- Playwright for end-to-end coverage
- Docker Compose, Docker image builds, Helm charts

## Quick Start

1. Install dependencies with `pnpm install`.
2. Copy environment values from `.env.example` into `.env` if needed.
3. Start local supporting services with `docker compose up -d` or use `make up` for the dev bootstrap path.
4. Run the app with `pnpm dev`.

Important local defaults:

- App URL: `http://localhost:8887`
- Postgres: `postgresql://devuser:changeme@localhost:5433/devdb?schema=public`
- Mailpit UI: `http://localhost:8025`
- Pocket ID: `http://localhost:3055`
- Keycloak: `http://localhost:3056`

## High-Value Commands

- `pnpm dev`: start the Next.js dev server on port `8887`
- `pnpm build`: production build
- `pnpm start`: run the production server
- `pnpm lint`: lint the codebase
- `pnpm db:generate`: generate Drizzle artifacts
- `pnpm db:migrate`: apply Drizzle migrations
- `pnpm auth:generate`: regenerate Better Auth artifacts from `src/lib/auth/auth.ts`
- `make up`: run the app dev entrypoint, including Drizzle generate/migrate
- `make e2e-auto`: run the dockerized E2E stack and Playwright suite
- `make e2e-manual`: open Playwright UI against the E2E stack
- `make seed-auth`: restore local auth providers from `seeds/`

## Codebase Map

- `app/`: Next.js App Router entrypoints, route groups, layouts, and API routes
- `app/(auth)`: login, registration, password reset, and auth guard screens
- `app/(customer)/dashboard`: authenticated dashboard routes split into admin and organization areas
- `app/api`: server endpoints such as config and event streaming
- `src/features/`: domain logic organized by feature, often with actions, schemas, hooks, and components
- `src/components/ui`: reusable UI primitives
- `src/components/wrappers`: composed dashboard and auth screens
- `src/db/schema`: numbered Drizzle schema modules
- `src/db/services`: database-facing query helpers and service functions
- `src/db/index.ts`: Drizzle client and schema aggregation
- `src/lib`: shared infrastructure such as auth, logger, ACL, tasks, and safe actions
- `src/utils`: low-level helpers
- `e2e/`: Playwright specs and helpers
- `docker/`: Dockerfiles, nginx, and entrypoints
- `helm/`: Helm chart for deployment
- `seeds/`: local auth provider seed data
- `private/`: local runtime data such as uploads and keys

## Architectural Conventions

### Routes

- Treat `app/` files as composition boundaries, not the main place for business logic.
- Keep layout and page files focused on loading data, auth checks, and rendering feature components.
- Preserve route groups like `(auth)`, `(customer)`, `(admin)`, and `(organization)` instead of flattening them.

### Features

Feature directories in `src/features/<domain>` usually own:

- `<domain>.action.ts`: server actions, often protected with `userAction`
- `<domain>.schema.ts`: Zod schemas and inferred types
- `components/`: feature-local UI
- `hooks/` or `services/`: feature-local client/server helpers

When adding new behavior, extend the closest existing feature area before creating a brand-new top-level pattern.

### Server Actions

- Use `"use server"` actions for mutations.
- Prefer `action` or `userAction` from `src/lib/safe-actions/actions.ts`.
- Keep validation at the action boundary with Zod schemas from the feature folder.
- Return the established `success` / `actionSuccess` / `actionError` shapes when working in existing action flows.

### Database Layer

- Drizzle schema files are numbered in `src/db/schema`. Keep that convention for new tables.
- Drizzle output lives in `src/db/migrations`.
- `src/db/index.ts` aggregates schemas and creates the shared client.
- Add reusable query logic in `src/db/services` when it would otherwise bloat actions or route files.
- Be careful editing schema import/export wiring in `src/db/index.ts`; it already contains some historical naming mismatches.

### UI and Forms

- Reuse primitives from `src/components/ui` before introducing new base components.
- Many forms use `useZodForm`, `react-hook-form`, and feature-local Zod schemas. Follow that pattern.
- Keep feature-specific UI in `src/features/.../components` or `src/components/wrappers/...` depending on reuse scope.

## Testing And Verification

Run the smallest useful verification for the area you changed, then scale up if needed.

- Always run `pnpm lint` for code changes.
- Run `pnpm build` for cross-cutting or production-sensitive changes.
- Run targeted Playwright specs with `pnpm exec playwright test <path>` when working in covered flows.
- Run `make e2e-auto` for changes that affect auth, dashboard flows, notifications, storage providers, or containerized behavior.

Playwright notes:

- Test root is `e2e/`.
- The suite is organized into ordered projects: `setup`, `auth`, `access-management`, `notification`, `storage`, `agent`, `project`, `cleanup`.
- Local E2E relies on `docker-compose.prod.yml` and `PROJECT_URL=http://localhost:8887`.

## Environment Notes

- The app reads from `.env`; use `.env.example` as the baseline.
- `LOG_LEVEL` is available and useful when debugging noisy background behavior.
- The default development database runs on port `5433`, not Postgres’ usual `5432`.
- Notification and storage E2E flows may require extra secrets in CI that are not available locally by default.

## Deployment And Release Context

- Docker image build definitions live under `docker/` and `.github/workflows/docker.yml`.
- Helm packaging lives under `helm/`.
- Pull requests to `main` trigger E2E coverage.
- Security checks run on pull requests and pushes to `main`.
- Merging a PR into `main` can trigger automated release publishing unless the PR title contains `[skip-release]`.

## Safe Change Guidelines

- Do not edit `.env`, `seeds/`, or generated auth artifacts unless the task requires it.
- Avoid broad formatting-only rewrites; the repo has mixed formatting styles and localized edits are safer.
- Do not rename schema files, route groups, or top-level feature folders without an explicit request.
- If you touch migrations or auth generation, mention it clearly in your summary because those changes have downstream impact.

## Preferred Agent Workflow

1. Inspect the nearest existing feature, route, or service before coding.
2. Make focused changes in the smallest responsible layer.
3. Verify with lint, targeted tests, or E2E as appropriate.
4. Summarize what changed, what was verified, and any remaining risks.

When unsure where new code belongs, prefer these defaults:

- mutation logic: `src/features/<domain>/*.action.ts`
- validation/types: `src/features/<domain>/*.schema.ts`
- reusable DB queries: `src/db/services/*.ts`
- shared infrastructure: `src/lib/**`
- page composition: `app/**`
