# Telemetry Feature — Design

- **Date:** 2026-07-10
- **Branch:** `feat/telemetry`
- **Status:** Approved (design), pending implementation plan

## Goal

Collect anonymous usage metrics from Portabase instances in production to
understand real-world usage, without breaking the database and with the smallest
possible footprint. 8 P1 KPIs, one boolean env var, a 24h cron, export to
Portabase's OpenTelemetry collector.

Guiding principle: pragmatic, not a full telemetry platform.

## KPIs (P1)

| # | KPI | Source |
|---|-----|--------|
| 1 | Organizations + users created | `organization`, `user` counts |
| 2 | Database types used | `databases.dbms` grouped |
| 3 | Agents attached to instance | `agents` count |
| 4 | Databases configured | `databases` count |
| 5 | Storage backends + distribution | `storage_channel.provider` grouped |
| 6 | Notification channels + distribution | `notification_channel.provider` grouped |
| 7 | Dashboard version | `env.NEXT_PUBLIC_PROJECT_VERSION` |
| 8 | Agent versions | `agents.version` grouped |

## Constraints

- Single boolean env var: `TELEMETRY=true|false` (**default `true`** — telemetry
  is opt-out). No other config level. OTLP endpoint is a hardcoded constant chosen
  by `NODE_ENV`.
- Data anonymized before export.
- **Zero breakage, zero migration.** KPI collection is read-only. The instance
  UUID lives in a file (`private/telemetry/data.json`), not the DB — no schema
  change, no migration at all.

## Architecture

Dedicated feature `src/features/telemetry/`:

```
src/features/telemetry/
  actions/telemetry.action.ts      # compileTelemetryAction — next-safe-action, compiles KPIs
  queries/telemetry.queries.ts     # dedicated count-only DB queries (no reuse of existing services)
  services/instance-id.ts          # getOrCreateInstanceId() — file-based UUID (private/telemetry/data.json)
  services/anonymize.ts            # hash instanceId + map enum values -> public labels
  otel/instrumentation.ts          # OTel MeterProvider + Resource (instance UUID) + OTLP exporter
  otel/export.ts                   # exportTelemetry(payload) — set gauges + forceFlush
  run.ts                           # runTelemetry() — orchestrator called by cron (compile -> export)
  constants.ts                     # PORTABASE_OTLP_ENDPOINT (per NODE_ENV), meter/service names
  schemas/telemetry.schema.ts      # zod TelemetryPayload (validated before export)
  index.ts                         # public exports
```

### Data flow

```
node-cron (24h)
  -> telemetryJob  (src/lib/tasks/index.ts, gated on env.TELEMETRY)
    -> runTelemetry()  (features/telemetry/run.ts)
      -> compileTelemetryAction()  (next-safe-action) -> queries -> anonymize -> TelemetryPayload
      -> exportTelemetry(payload)  -> OTLP MeterProvider.forceFlush -> Portabase collector
```

### Design for isolation

- `queries/` — only knows how to read aggregates. No anonymization, no export.
- `services/anonymize.ts` — pure functions: raw counts/enums -> public payload.
- `actions/telemetry.action.ts` — compiles the payload (queries + anonymize),
  validates it, returns it. Decoupled from transport; testable standalone.
- `otel/` — owns all OpenTelemetry setup and the actual send. Knows nothing about
  the DB.
- `run.ts` — the only place that wires compile -> export together.

## KPI queries (dedicated, read-only)

New queries in `queries/telemetry.queries.ts`, run in parallel (`Promise.all`).
None reuse existing services — each selects only what is strictly needed.

```ts
// counts
select({ c: count() }).from(schemas.organization)
select({ c: count() }).from(schemas.user)
select({ c: count() }).from(schemas.agent)
select({ c: count() }).from(schemas.database)

// distributions
select({ k: schemas.database.dbms,             c: count() }).from(schemas.database).groupBy(schemas.database.dbms)
select({ k: schemas.storageChannel.provider,   c: count() }).from(schemas.storageChannel).groupBy(schemas.storageChannel.provider)
select({ k: schemas.notificationChannel.provider, c: count() }).from(schemas.notificationChannel).groupBy(schemas.notificationChannel.provider)
select({ k: schemas.agent.version,             c: count() }).from(schemas.agent).groupBy(schemas.agent.version)
```

No names, emails, hosts, configs, or free-text are ever selected — only counts
and enum labels.

## Anonymization (`services/anonymize.ts`)

- Payload carries **only counts and enum labels** (`postgresql`, `s3`, ...) —
  inherently non-identifying.
- **Instance ID:** `sha256(instanceId + env.PROJECT_SECRET)` -> hex. Stable
  pseudonym, not correlatable back to the DB row.
- **Enum -> public label mapping** (so exported labels match the KPI spec):
  - storage: `local -> on-premise`, `blob -> azure`,
    `google-cloud-storage -> gcs`, `s3 -> s3`, `google-drive -> google-drive`
  - notification: `smtp -> email`, others unchanged (`slack`, `discord`,
    `telegram`, `ntfy`, `gotify`, `webhook`, ...)
- Unknown/`null` enum values (e.g. agent `version` null) bucketed as `unknown`.

## Instance UUID (file-based, no DB)

- Stored in `private/telemetry/data.json` as `{ "id": "<uuid v4>" }`, mirroring
  the RSA master-key pattern (`getOrCreateMasterKey` writes under
  `env.PRIVATE_PATH`). Zero DB change, zero migration.
- `src/features/telemetry/services/instance-id.ts` →
  `getOrCreateInstanceId()`: `mkdir -p private/telemetry`, read `data.json` and
  return `id` if present; otherwise generate `crypto.randomUUID()`, write it
  (mode `0o600`), return it. Idempotent.
- The raw uuid never leaves the instance — it is SHA-256 hashed with
  `PROJECT_SECRET` before export.

## OpenTelemetry instrumentation (`otel/`)

New dependencies:

```
@opentelemetry/api
@opentelemetry/sdk-metrics
@opentelemetry/exporter-metrics-otlp-http
@opentelemetry/resources
@opentelemetry/semantic-conventions
```

`otel/instrumentation.ts`:

- `Resource`:
  `service.name = "portabase-dashboard"`,
  `service.version = env.NEXT_PUBLIC_PROJECT_VERSION`,
  `portabase.instance.id = <hashed instance id>`.
- `MeterProvider` + `OTLPMetricExporter({ url: PORTABASE_OTLP_ENDPOINT })`.
  Endpoint constant chosen by `NODE_ENV` in `constants.ts`:
  - production -> `https://telemetry.portabase.io`
  - otherwise (dev) -> `https://sandbox.telemetry.portabase.io`
- On setup, log via the module logger that telemetry is active and which endpoint
  it targets (e.g. `log.info({ endpoint }, "Telemetry enabled")`), so operators see
  it in boot logs.
- Meter with:
  - Gauges: `orgs_total`, `users_total`, `agents_total`, `databases_total`.
  - Distribution gauges keyed by attribute label: `databases_by_type`,
    `storage_by_backend`, `notifications_by_channel`, `agents_by_version`.

`otel/export.ts` — `exportTelemetry(payload)`: records gauge values from the
payload, then `meterProvider.forceFlush()` to push synchronously (cron drives
cadence; no PeriodicExportingMetricReader needed).

## Server action (`actions/telemetry.action.ts`)

- `"use server"`, uses the base **next-safe-action** client `action` from
  `@/lib/safe-actions/actions` (NOT `userAction` — the cron has no user session).
- `compileTelemetryAction = action.action(async () => { ... })`:
  runs the queries, anonymizes, builds and zod-validates `TelemetryPayload`,
  returns it.
- Returns the next-safe-action shape `{ data, serverError, validationErrors }`;
  `runTelemetry()` unwraps `.data`.

## Cron (24h)

- **Function invoked:** `runTelemetry()` (`features/telemetry/run.ts`) ->
  `compileTelemetryAction()` then `exportTelemetry()`.
- **New job** `telemetryJob` in `src/lib/tasks/index.ts`:
  `cron.schedule("0 3 * * *", ...)` — daily at 03:00 (24h cadence). Expression is
  hardcoded because only one env var is allowed. Body:
  `if (!env.TELEMETRY) return;` then `runTelemetry()` inside try/catch with the
  module logger, matching the existing job pattern.
- **Registered** in `setupCronJobs()` (`src/utils/init/cron.ts`):
  `if (env.TELEMETRY) telemetryJob.start();`. Triggered automatically at boot via
  `init()` <- `instrumentation.ts`.

## Env var

- `src/env.mjs` server block:
  `TELEMETRY: z.enum(["true","false"]).default("true").transform(v => v === "true")`,
  plus matching `runtimeEnv.TELEMETRY: process.env.TELEMETRY`.
- `.env` and `.env.example`: add `TELEMETRY=true`.
- Endpoint is **not** an env var — hardcoded in `constants.ts`, selected by
  `NODE_ENV` (see OTel section).

## Zero-breakage guarantees

- All 8 KPI queries are read-only aggregates; no detailed rows, no PII.
- No DB writes and no migration: the instance UUID lives in
  `private/telemetry/data.json`.
- Only new dependencies added; no existing call path modified.
- Cron is **ON by default** (`TELEMETRY=true`, opt-out). Boot logs announce it via
  the logger. Only anonymized aggregates leave the instance; setting
  `TELEMETRY=false` disables it entirely.

## Files touched

**New**
- `src/features/telemetry/actions/telemetry.action.ts`
- `src/features/telemetry/queries/telemetry.queries.ts`
- `src/features/telemetry/services/instance-id.ts`
- `src/features/telemetry/services/anonymize.ts`
- `src/features/telemetry/otel/instrumentation.ts`
- `src/features/telemetry/otel/export.ts`
- `src/features/telemetry/run.ts`
- `src/features/telemetry/constants.ts`
- `src/features/telemetry/schemas/telemetry.schema.ts`
- `src/features/telemetry/signoz-dashboard.json`
- `src/features/telemetry/index.ts`

**Modified**
- `src/lib/tasks/index.ts` (add `telemetryJob`)
- `src/utils/init/cron.ts` (start `telemetryJob` when `TELEMETRY`)
- `src/env.mjs` (add `TELEMETRY`)
- `.env`, `.env.example` (add `TELEMETRY=false`)
- `package.json` (OTel deps)
```
