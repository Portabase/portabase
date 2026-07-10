# Telemetry Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect 8 anonymized usage KPIs from a Portabase instance and export them every 24h to Portabase's OpenTelemetry collector, opt-out via a single env var.

**Architecture:** A dedicated `src/features/telemetry/` feature with read-only aggregate DB queries, a pure anonymization layer, a next-safe-action that compiles a validated payload, and an OTLP metrics exporter. A node-cron job (registered in the existing boot init) runs it daily. The only DB write is one additive nullable column (`settings.instance_id`) populated idempotently at boot.

**Tech Stack:** Next.js, Drizzle ORM (node-postgres), next-safe-action v7, node-cron, OpenTelemetry SDK (metrics OTLP HTTP), Zod, Vitest (new, for pure-logic unit tests), tsx (existing, for integration smoke checks).

## Global Constraints

- Single env var only: `TELEMETRY` — `z.enum(["true","false"]).default("true").transform(v => v === "true")`. No other telemetry config. Default **true** (opt-out).
- OTLP endpoint is NOT an env var. Hardcoded per `NODE_ENV`: production → `https://telemetry.portabase.io`, otherwise → `https://sandbox.telemetry.portabase.io`.
- Zero breakage: all KPI queries read-only aggregates; the only write is additive nullable `settings.instance_id` + idempotent populate at boot.
- Anonymization: export only counts + enum labels. Instance id = `sha256(instanceId + PROJECT_SECRET)`. No names/emails/hosts/configs.
- Follow existing feature conventions: `src/features/<name>/{actions,queries,services,schemas}`, actions are `*.action.ts` using clients from `@/lib/safe-actions/actions`, DB via `db` + `schemas` from `@/db`.
- Service resource name: `portabase-dashboard`. Meter name: `portabase-telemetry`.
- Public enum labels: storage `local→on-premise`, `blob→azure`, `google-cloud-storage→gcs`, `s3→s3`, `google-drive→google-drive`; notification `smtp→email`, others unchanged; null → `unknown`.

---

## File Structure

**New**
- `src/features/telemetry/constants.ts` — endpoint selection + service/meter names
- `src/features/telemetry/schemas/telemetry.schema.ts` — zod `TelemetryPayload`
- `src/features/telemetry/queries/telemetry.queries.ts` — `collectRawTelemetry()`
- `src/features/telemetry/services/anonymize.ts` — pure `hashInstanceId` + `buildTelemetryPayload`
- `src/features/telemetry/services/anonymize.test.ts` — vitest unit tests
- `src/features/telemetry/constants.test.ts` — vitest unit tests
- `src/features/telemetry/actions/telemetry.action.ts` — `compileTelemetryAction`
- `src/features/telemetry/otel/instrumentation.ts` — `getMeterProvider`
- `src/features/telemetry/otel/export.ts` — `exportTelemetry`
- `src/features/telemetry/run.ts` — `runTelemetry` orchestrator
- `src/features/telemetry/index.ts` — public exports
- `vitest.config.ts`
- new Drizzle migration under `src/db/migrations/`

**Modified**
- `src/env.mjs` (add `TELEMETRY`)
- `.env`, `.env.example` (add `TELEMETRY=true`)
- `package.json` (deps + `test` script)
- `src/db/schema/01_setting.ts` (add `instance_id`)
- `src/utils/init/setting.ts` (populate `instanceId`)
- `src/lib/tasks/index.ts` (add `telemetryJob`)
- `src/utils/init/cron.ts` (start `telemetryJob` + log when `TELEMETRY`)

---

## Task 1: Dependencies, env var, constants, Vitest

**Files:**
- Modify: `package.json` (deps + script)
- Modify: `src/env.mjs`
- Modify: `.env`, `.env.example`
- Create: `vitest.config.ts`
- Create: `src/features/telemetry/constants.ts`
- Test: `src/features/telemetry/constants.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `env.TELEMETRY: boolean`
  - `getOtlpEndpoint(): string`
  - `OTLP_METRICS_URL(): string` (endpoint + `/v1/metrics`)
  - `SERVICE_NAME = "portabase-dashboard"`, `TELEMETRY_METER_NAME = "portabase-telemetry"`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add @opentelemetry/api @opentelemetry/sdk-metrics @opentelemetry/exporter-metrics-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions
pnpm add -D vitest
```

- [ ] **Step 2: Add the `test` script to `package.json`**

In the `"scripts"` block add:

```json
"test": "vitest run"
```

- [ ] **Step 3: Add `TELEMETRY` to `src/env.mjs`**

In the `server:` block (next to the other boolean flags like `DEMO_ENABLED`), add:

```js
        TELEMETRY: z
            .enum(["true", "false"])
            .default("true")
            .transform((val) => val === "true"),
```

In the `runtimeEnv:` block add:

```js
        TELEMETRY: process.env.TELEMETRY,
```

- [ ] **Step 4: Add `TELEMETRY=true` to `.env` and `.env.example`**

Append to both files:

```
TELEMETRY=true
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
```

- [ ] **Step 6: Write the failing test `src/features/telemetry/constants.test.ts`**

```ts
import { afterEach, describe, expect, it } from "vitest";
import { getOtlpEndpoint, OTLP_METRICS_URL } from "@/features/telemetry/constants";

const original = process.env.NODE_ENV;

afterEach(() => {
    process.env.NODE_ENV = original;
});

describe("getOtlpEndpoint", () => {
    it("returns the production endpoint when NODE_ENV=production", () => {
        process.env.NODE_ENV = "production";
        expect(getOtlpEndpoint()).toBe("https://telemetry.portabase.io");
    });

    it("returns the sandbox endpoint otherwise", () => {
        process.env.NODE_ENV = "development";
        expect(getOtlpEndpoint()).toBe("https://sandbox.telemetry.portabase.io");
    });

    it("appends the OTLP metrics path", () => {
        process.env.NODE_ENV = "production";
        expect(OTLP_METRICS_URL()).toBe("https://telemetry.portabase.io/v1/metrics");
    });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `pnpm test src/features/telemetry/constants.test.ts`
Expected: FAIL — cannot resolve `@/features/telemetry/constants`.

- [ ] **Step 8: Create `src/features/telemetry/constants.ts`**

```ts
export const SERVICE_NAME = "portabase-dashboard";
export const TELEMETRY_METER_NAME = "portabase-telemetry";

export function getOtlpEndpoint(): string {
    return process.env.NODE_ENV === "production"
        ? "https://telemetry.portabase.io"
        : "https://sandbox.telemetry.portabase.io";
}

export function OTLP_METRICS_URL(): string {
    return `${getOtlpEndpoint()}/v1/metrics`;
}
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `pnpm test src/features/telemetry/constants.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-lock.yaml src/env.mjs .env.example vitest.config.ts src/features/telemetry/constants.ts src/features/telemetry/constants.test.ts
git commit -m "feat(telemetry): deps, TELEMETRY env var, endpoint constants + vitest"
```

---

## Task 2: Instance UUID — schema column, migration, boot populate

**Files:**
- Modify: `src/db/schema/01_setting.ts`
- Modify: `src/utils/init/setting.ts`
- Create: new file under `src/db/migrations/`
- Verify: dev DB via `pnpm tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `schemas.setting.instanceId` (nullable `uuid` column `instance_id`), guaranteed non-null after boot.

- [ ] **Step 1: Add the column to `src/db/schema/01_setting.ts`**

In the `setting` table definition, add the column right before `...timestamps`:

```ts
    instanceId: uuid("instance_id"),
```

(`uuid` is already imported in this file.)

- [ ] **Step 2: Generate the migration**

Run: `pnpm db:generate`
Expected: a new SQL file appears under `src/db/migrations/` containing
`ALTER TABLE "settings" ADD COLUMN "instance_id" uuid;` (nullable — no default, no NOT NULL). Inspect it to confirm it is additive only.

- [ ] **Step 3: Populate `instanceId` in `src/utils/init/setting.ts`**

Inside the `db.transaction` in `createSettingsIfNotExist`, after the existing
block that sets `defaultStorageChannelId` (the `if (!finalSystemSetting.defaultStorageChannelId)` block), add:

```ts
    if (!finalSystemSetting.instanceId) {
      await tx
        .update(drizzleDb.schemas.setting)
        .set(withUpdatedAt({ instanceId: crypto.randomUUID() }))
        .where(eq(drizzleDb.schemas.setting.id, finalSystemSetting.id));
    }
```

(`crypto` is a Node global; `withUpdatedAt`, `eq`, `drizzleDb` are already imported.)

- [ ] **Step 4: Apply the migration to the dev DB**

Run: `pnpm db:migrate`
Expected: migration applies with no error.

- [ ] **Step 5: Verify column + populate against the dev DB**

Create `scratch-telemetry-check.ts` at the repo root:

```ts
import { db, schemas } from "@/db";
import { createSettingsIfNotExist } from "@/utils/init/setting";

async function main() {
    await createSettingsIfNotExist();
    const rows = await db.select({ instanceId: schemas.setting.instanceId }).from(schemas.setting);
    console.log("instanceIds:", rows);
    process.exit(0);
}
main();
```

Run: `pnpm tsx scratch-telemetry-check.ts`
Expected: prints at least one row with a non-null UUID `instanceId`.

- [ ] **Step 6: Remove the scratch file**

```bash
rm scratch-telemetry-check.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/db/schema/01_setting.ts src/db/migrations src/utils/init/setting.ts
git commit -m "feat(telemetry): add settings.instance_id column + idempotent boot populate"
```

---

## Task 3: Telemetry payload schema

**Files:**
- Create: `src/features/telemetry/schemas/telemetry.schema.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `telemetryPayloadSchema` (zod)
  - `type TelemetryPayload`
  - `type DistributionEntry = { label: string; count: number }`

- [ ] **Step 1: Create `src/features/telemetry/schemas/telemetry.schema.ts`**

```ts
import { z } from "zod";

export const distributionEntrySchema = z.object({
    label: z.string(),
    count: z.number().int().nonnegative(),
});

export const telemetryPayloadSchema = z.object({
    instanceId: z.string(),
    dashboardVersion: z.string(),
    orgsTotal: z.number().int().nonnegative(),
    usersTotal: z.number().int().nonnegative(),
    agentsTotal: z.number().int().nonnegative(),
    databasesTotal: z.number().int().nonnegative(),
    databasesByType: z.array(distributionEntrySchema),
    storageByBackend: z.array(distributionEntrySchema),
    notificationsByChannel: z.array(distributionEntrySchema),
    agentsByVersion: z.array(distributionEntrySchema),
});

export type DistributionEntry = z.infer<typeof distributionEntrySchema>;
export type TelemetryPayload = z.infer<typeof telemetryPayloadSchema>;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/features/telemetry/schemas/telemetry.schema.ts
git commit -m "feat(telemetry): add TelemetryPayload zod schema"
```

---

## Task 4: Anonymization (pure logic, TDD)

**Files:**
- Create: `src/features/telemetry/services/anonymize.ts`
- Test: `src/features/telemetry/services/anonymize.test.ts`

**Interfaces:**
- Consumes: `RawTelemetry` (defined in Task 5 — the shape is repeated here so this task is self-contained), `TelemetryPayload`, `DistributionEntry` from Task 3.
- Produces:
  - `type AnonymizeContext = { secret: string; version: string }`
  - `hashInstanceId(instanceId: string, secret: string): string`
  - `buildTelemetryPayload(raw: RawTelemetry, ctx: AnonymizeContext): TelemetryPayload`

The `RawTelemetry` shape (created in Task 5, imported as a type here):

```ts
type RawCount = { key: string | null; count: number };
type RawTelemetry = {
    instanceId: string | null;
    orgsTotal: number;
    usersTotal: number;
    agentsTotal: number;
    databasesTotal: number;
    databasesByType: RawCount[];
    storageByBackend: RawCount[];
    notificationsByChannel: RawCount[];
    agentsByVersion: RawCount[];
};
```

- [ ] **Step 1: Write the failing test `src/features/telemetry/services/anonymize.test.ts`**

```ts
import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import {
    buildTelemetryPayload,
    hashInstanceId,
} from "@/features/telemetry/services/anonymize";
import type { RawTelemetry } from "@/features/telemetry/queries/telemetry.queries";

const raw: RawTelemetry = {
    instanceId: "11111111-1111-1111-1111-111111111111",
    orgsTotal: 3,
    usersTotal: 5,
    agentsTotal: 2,
    databasesTotal: 7,
    databasesByType: [{ key: "postgresql", count: 4 }, { key: "mongodb", count: 3 }],
    storageByBackend: [{ key: "local", count: 1 }, { key: "blob", count: 2 }, { key: "google-cloud-storage", count: 1 }],
    notificationsByChannel: [{ key: "smtp", count: 2 }, { key: "slack", count: 1 }],
    agentsByVersion: [{ key: "1.4.0", count: 1 }, { key: null, count: 1 }],
};

const ctx = { secret: "s3cr3t", version: "1.22.2" };

describe("hashInstanceId", () => {
    it("is a deterministic sha256 of id + secret, not the raw id", () => {
        const expected = createHash("sha256").update("abc" + "s3cr3t").digest("hex");
        expect(hashInstanceId("abc", "s3cr3t")).toBe(expected);
        expect(hashInstanceId("abc", "s3cr3t")).not.toContain("abc");
    });
});

describe("buildTelemetryPayload", () => {
    const payload = buildTelemetryPayload(raw, ctx);

    it("hashes the instance id", () => {
        expect(payload.instanceId).toBe(hashInstanceId(raw.instanceId!, ctx.secret));
    });

    it("carries counts and version", () => {
        expect(payload.orgsTotal).toBe(3);
        expect(payload.usersTotal).toBe(5);
        expect(payload.agentsTotal).toBe(2);
        expect(payload.databasesTotal).toBe(7);
        expect(payload.dashboardVersion).toBe("1.22.2");
    });

    it("maps storage backends to public labels", () => {
        expect(payload.storageByBackend).toEqual([
            { label: "on-premise", count: 1 },
            { label: "azure", count: 2 },
            { label: "gcs", count: 1 },
        ]);
    });

    it("maps smtp to email and keeps others", () => {
        expect(payload.notificationsByChannel).toEqual([
            { label: "email", count: 2 },
            { label: "slack", count: 1 },
        ]);
    });

    it("buckets null distribution keys as unknown", () => {
        expect(payload.agentsByVersion).toEqual([
            { label: "1.4.0", count: 1 },
            { label: "unknown", count: 1 },
        ]);
    });

    it("falls back to unknown when instanceId is null", () => {
        const p = buildTelemetryPayload({ ...raw, instanceId: null }, ctx);
        expect(p.instanceId).toBe(hashInstanceId("unknown", ctx.secret));
    });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/features/telemetry/services/anonymize.test.ts`
Expected: FAIL — cannot resolve `@/features/telemetry/services/anonymize`.

- [ ] **Step 3: Create `src/features/telemetry/services/anonymize.ts`**

```ts
import { createHash } from "crypto";
import type { RawTelemetry, RawCount } from "@/features/telemetry/queries/telemetry.queries";
import {
    telemetryPayloadSchema,
    type DistributionEntry,
    type TelemetryPayload,
} from "@/features/telemetry/schemas/telemetry.schema";

export type AnonymizeContext = { secret: string; version: string };

const STORAGE_LABELS: Record<string, string> = {
    local: "on-premise",
    s3: "s3",
    "google-drive": "google-drive",
    "google-cloud-storage": "gcs",
    blob: "azure",
};

const NOTIFICATION_LABELS: Record<string, string> = {
    smtp: "email",
};

export function hashInstanceId(instanceId: string, secret: string): string {
    return createHash("sha256").update(`${instanceId}${secret}`).digest("hex");
}

function mapDistribution(
    rows: RawCount[],
    labels: Record<string, string> = {},
): DistributionEntry[] {
    return rows.map((r) => ({
        label: r.key ? labels[r.key] ?? r.key : "unknown",
        count: r.count,
    }));
}

export function buildTelemetryPayload(
    raw: RawTelemetry,
    ctx: AnonymizeContext,
): TelemetryPayload {
    const payload: TelemetryPayload = {
        instanceId: hashInstanceId(raw.instanceId ?? "unknown", ctx.secret),
        dashboardVersion: ctx.version,
        orgsTotal: raw.orgsTotal,
        usersTotal: raw.usersTotal,
        agentsTotal: raw.agentsTotal,
        databasesTotal: raw.databasesTotal,
        databasesByType: mapDistribution(raw.databasesByType),
        storageByBackend: mapDistribution(raw.storageByBackend, STORAGE_LABELS),
        notificationsByChannel: mapDistribution(raw.notificationsByChannel, NOTIFICATION_LABELS),
        agentsByVersion: mapDistribution(raw.agentsByVersion),
    };
    return telemetryPayloadSchema.parse(payload);
}
```

Note: this imports the `RawTelemetry`/`RawCount` **types** from Task 5's file. If Task 5 is not yet implemented, create the queries file's type exports first (Task 5 Step 1) — or implement Task 5 before running this test.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test src/features/telemetry/services/anonymize.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
git add src/features/telemetry/services/anonymize.ts src/features/telemetry/services/anonymize.test.ts
git commit -m "feat(telemetry): pure anonymization (hash + enum label mapping)"
```

---

## Task 5: Dedicated read-only queries

**Files:**
- Create: `src/features/telemetry/queries/telemetry.queries.ts`
- Verify: dev DB via `pnpm tsx`

**Interfaces:**
- Consumes: `db`, `schemas` from `@/db`.
- Produces:
  - `type RawCount = { key: string | null; count: number }`
  - `type RawTelemetry` (shape as used in Task 4)
  - `collectRawTelemetry(): Promise<RawTelemetry>`

- [ ] **Step 1: Create `src/features/telemetry/queries/telemetry.queries.ts`**

```ts
import { count } from "drizzle-orm";
import { db, schemas } from "@/db";

export type RawCount = { key: string | null; count: number };

export type RawTelemetry = {
    instanceId: string | null;
    orgsTotal: number;
    usersTotal: number;
    agentsTotal: number;
    databasesTotal: number;
    databasesByType: RawCount[];
    storageByBackend: RawCount[];
    notificationsByChannel: RawCount[];
    agentsByVersion: RawCount[];
};

async function total(table: Parameters<typeof db.select>[0] extends never ? never : any): Promise<number> {
    const [row] = await db.select({ c: count() }).from(table);
    return row?.c ?? 0;
}

export async function collectRawTelemetry(): Promise<RawTelemetry> {
    const [
        orgsTotal,
        usersTotal,
        agentsTotal,
        databasesTotal,
        databasesByType,
        storageByBackend,
        notificationsByChannel,
        agentsByVersion,
        settingRow,
    ] = await Promise.all([
        total(schemas.organization),
        total(schemas.user),
        total(schemas.agent),
        total(schemas.database),
        db
            .select({ key: schemas.database.dbms, count: count() })
            .from(schemas.database)
            .groupBy(schemas.database.dbms),
        db
            .select({ key: schemas.storageChannel.provider, count: count() })
            .from(schemas.storageChannel)
            .groupBy(schemas.storageChannel.provider),
        db
            .select({ key: schemas.notificationChannel.provider, count: count() })
            .from(schemas.notificationChannel)
            .groupBy(schemas.notificationChannel.provider),
        db
            .select({ key: schemas.agent.version, count: count() })
            .from(schemas.agent)
            .groupBy(schemas.agent.version),
        db.select({ instanceId: schemas.setting.instanceId }).from(schemas.setting).limit(1),
    ]);

    return {
        instanceId: settingRow[0]?.instanceId ?? null,
        orgsTotal,
        usersTotal,
        agentsTotal,
        databasesTotal,
        databasesByType,
        storageByBackend,
        notificationsByChannel,
        agentsByVersion,
    };
}
```

If the `total()` helper's generic signature causes a TS complaint, replace it with four explicit inline count queries following the same `db.select({ c: count() }).from(<table>)` pattern used elsewhere in the codebase (e.g. `src/features/agents/actions/agents.action.ts`). Correctness over cleverness.

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Verify against the dev DB**

Create `scratch-telemetry-check.ts` at the repo root:

```ts
import { collectRawTelemetry } from "@/features/telemetry/queries/telemetry.queries";

async function main() {
    const raw = await collectRawTelemetry();
    console.log(JSON.stringify(raw, null, 2));
    process.exit(0);
}
main();
```

Run: `pnpm tsx scratch-telemetry-check.ts`
Expected: prints an object with numeric totals, arrays of `{ key, count }`, and a non-null `instanceId`.

- [ ] **Step 4: Remove the scratch file**

```bash
rm scratch-telemetry-check.ts
```

- [ ] **Step 5: Re-run the anonymize test (now that its type import resolves)**

Run: `pnpm test src/features/telemetry/services/anonymize.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/telemetry/queries/telemetry.queries.ts
git commit -m "feat(telemetry): dedicated read-only aggregate queries"
```

---

## Task 6: Compile server action (next-safe-action)

**Files:**
- Create: `src/features/telemetry/actions/telemetry.action.ts`
- Verify: dev DB via `pnpm tsx`

**Interfaces:**
- Consumes: `action` from `@/lib/safe-actions/actions`, `collectRawTelemetry`, `buildTelemetryPayload`, `env`.
- Produces: `compileTelemetryAction` — a next-safe-action returning `{ data?: TelemetryPayload; serverError?: string }`.

- [ ] **Step 1: Create `src/features/telemetry/actions/telemetry.action.ts`**

```ts
"use server";

import { z } from "zod";
import { action } from "@/lib/safe-actions/actions";
import { env } from "@/env.mjs";
import { collectRawTelemetry } from "@/features/telemetry/queries/telemetry.queries";
import { buildTelemetryPayload } from "@/features/telemetry/services/anonymize";

export const compileTelemetryAction = action
    .schema(z.object({}))
    .action(async () => {
        const raw = await collectRawTelemetry();
        return buildTelemetryPayload(raw, {
            secret: env.PROJECT_SECRET,
            version: env.NEXT_PUBLIC_PROJECT_VERSION ?? "unknown",
        });
    });
```

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Verify the action compiles a valid payload**

Create `scratch-telemetry-check.ts` at the repo root:

```ts
import { compileTelemetryAction } from "@/features/telemetry/actions/telemetry.action";

async function main() {
    const res = await compileTelemetryAction({});
    console.log("data:", JSON.stringify(res?.data, null, 2));
    console.log("serverError:", res?.serverError);
    process.exit(0);
}
main();
```

Run: `pnpm tsx scratch-telemetry-check.ts`
Expected: `data` is the anonymized payload (hashed `instanceId`, mapped labels), `serverError` is undefined.

- [ ] **Step 4: Remove the scratch file**

```bash
rm scratch-telemetry-check.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/features/telemetry/actions/telemetry.action.ts
git commit -m "feat(telemetry): compileTelemetryAction (next-safe-action)"
```

---

## Task 7: OpenTelemetry exporter

**Files:**
- Create: `src/features/telemetry/otel/instrumentation.ts`
- Create: `src/features/telemetry/otel/export.ts`
- Verify: sandbox endpoint via `pnpm tsx`

**Interfaces:**
- Consumes: `TelemetryPayload`, `OTLP_METRICS_URL`, `SERVICE_NAME`, `TELEMETRY_METER_NAME`, `env`.
- Produces:
  - `getMeterProvider(instanceId: string): MeterProvider`
  - `exportTelemetry(payload: TelemetryPayload): Promise<void>`

- [ ] **Step 1: Create `src/features/telemetry/otel/instrumentation.ts`**

```ts
import { MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { env } from "@/env.mjs";
import { OTLP_METRICS_URL, SERVICE_NAME } from "@/features/telemetry/constants";

export function getMeterProvider(instanceId: string): MeterProvider {
    const exporter = new OTLPMetricExporter({ url: OTLP_METRICS_URL() });
    const reader = new PeriodicExportingMetricReader({
        exporter,
        // Effectively manual: the cron drives cadence; we call forceFlush().
        exportIntervalMillis: 24 * 60 * 60 * 1000,
    });
    return new MeterProvider({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: SERVICE_NAME,
            [ATTR_SERVICE_VERSION]: env.NEXT_PUBLIC_PROJECT_VERSION ?? "unknown",
            "portabase.instance.id": instanceId,
        }),
        readers: [reader],
    });
}
```

If the installed `@opentelemetry/resources` version does not export `resourceFromAttributes`, use `new Resource({ ... })` instead (older API). If `@opentelemetry/semantic-conventions` does not export `ATTR_SERVICE_NAME`/`ATTR_SERVICE_VERSION`, use the string keys `"service.name"` / `"service.version"`. Pick whichever the installed versions expose; confirm with `pnpm tsc --noEmit`.

- [ ] **Step 2: Create `src/features/telemetry/otel/export.ts`**

```ts
import type { Meter } from "@opentelemetry/api";
import { getMeterProvider } from "@/features/telemetry/otel/instrumentation";
import { TELEMETRY_METER_NAME } from "@/features/telemetry/constants";
import type {
    DistributionEntry,
    TelemetryPayload,
} from "@/features/telemetry/schemas/telemetry.schema";

function recordDistribution(
    meter: Meter,
    name: string,
    attrKey: string,
    entries: DistributionEntry[],
): void {
    const gauge = meter.createGauge(name);
    for (const entry of entries) {
        gauge.record(entry.count, { [attrKey]: entry.label });
    }
}

export async function exportTelemetry(payload: TelemetryPayload): Promise<void> {
    const provider = getMeterProvider(payload.instanceId);
    const meter = provider.getMeter(TELEMETRY_METER_NAME);

    meter.createGauge("portabase.orgs.total").record(payload.orgsTotal);
    meter.createGauge("portabase.users.total").record(payload.usersTotal);
    meter.createGauge("portabase.agents.total").record(payload.agentsTotal);
    meter.createGauge("portabase.databases.total").record(payload.databasesTotal);

    recordDistribution(meter, "portabase.databases.by_type", "type", payload.databasesByType);
    recordDistribution(meter, "portabase.storage.by_backend", "backend", payload.storageByBackend);
    recordDistribution(meter, "portabase.notifications.by_channel", "channel", payload.notificationsByChannel);
    recordDistribution(meter, "portabase.agents.by_version", "version", payload.agentsByVersion);

    await provider.forceFlush();
    await provider.shutdown();
}
```

If the installed `@opentelemetry/sdk-metrics` does not expose the synchronous `meter.createGauge` (Gauge instrument), replace each `createGauge(...).record(v, attrs)` with an observable gauge: `meter.createObservableGauge(name).addCallback((r) => r.observe(v, attrs))` and keep the same names/attributes. Confirm with `pnpm tsc --noEmit`.

- [ ] **Step 3: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Verify a real export to the sandbox endpoint**

Create `scratch-telemetry-check.ts` at the repo root:

```ts
import { exportTelemetry } from "@/features/telemetry/otel/export";

async function main() {
    await exportTelemetry({
        instanceId: "test-hash",
        dashboardVersion: "1.22.2",
        orgsTotal: 1,
        usersTotal: 1,
        agentsTotal: 0,
        databasesTotal: 0,
        databasesByType: [],
        storageByBackend: [{ label: "on-premise", count: 1 }],
        notificationsByChannel: [],
        agentsByVersion: [],
    });
    console.log("export completed");
    process.exit(0);
}
main();
```

Run: `NODE_ENV=development pnpm tsx scratch-telemetry-check.ts`
Expected: prints `export completed` with no thrown error. (Targets `https://sandbox.telemetry.portabase.io/v1/metrics`. A network/4xx from the collector is logged by the SDK but should not throw; if the sandbox is unreachable in the dev environment, confirm the request was attempted to the sandbox URL and treat that as pass.)

- [ ] **Step 5: Remove the scratch file**

```bash
rm scratch-telemetry-check.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/features/telemetry/otel/instrumentation.ts src/features/telemetry/otel/export.ts
git commit -m "feat(telemetry): OTLP metrics exporter + instance resource"
```

---

## Task 8: Orchestrator, cron job, boot wiring, feature exports

**Files:**
- Create: `src/features/telemetry/run.ts`
- Create: `src/features/telemetry/index.ts`
- Modify: `src/lib/tasks/index.ts`
- Modify: `src/utils/init/cron.ts`
- Verify: `pnpm tsx` + dev boot log

**Interfaces:**
- Consumes: `compileTelemetryAction`, `exportTelemetry`, `env`, `logger`, `getOtlpEndpoint`.
- Produces: `runTelemetry(): Promise<void>`, `telemetryJob` (node-cron task), feature barrel exports.

- [ ] **Step 1: Create `src/features/telemetry/run.ts`**

```ts
import { logger } from "@/lib/logger";
import { compileTelemetryAction } from "@/features/telemetry/actions/telemetry.action";
import { exportTelemetry } from "@/features/telemetry/otel/export";

const log = logger.child({ module: "telemetry" });

export async function runTelemetry(): Promise<void> {
    const result = await compileTelemetryAction({});
    const payload = result?.data;

    if (!payload) {
        log.error(
            { serverError: result?.serverError, validationErrors: result?.validationErrors },
            "Telemetry compile failed",
        );
        return;
    }

    await exportTelemetry(payload);
    log.info({ instanceId: payload.instanceId }, "Telemetry sent");
}
```

- [ ] **Step 2: Create `src/features/telemetry/index.ts`**

```ts
export { runTelemetry } from "@/features/telemetry/run";
export { compileTelemetryAction } from "@/features/telemetry/actions/telemetry.action";
export { getOtlpEndpoint } from "@/features/telemetry/constants";
export type { TelemetryPayload } from "@/features/telemetry/schemas/telemetry.schema";
```

- [ ] **Step 3: Add `telemetryJob` to `src/lib/tasks/index.ts`**

Add the import near the other task imports at the top:

```ts
import { runTelemetry } from "@/features/telemetry/run";
```

Append at the end of the file:

```ts
export const telemetryJob = cron.schedule("0 3 * * *", async () => {
    if (!env.TELEMETRY) return;
    try {
        log.info({ job: "cron", action: "start", name: "telemetryJob" }, "Telemetry Job started");
        await runTelemetry();
    } catch (err) {
        log.error({ job: "cron", name: "telemetryJob", error: err }, "Telemetry Job Error");
    }
});
```

(`cron`, `env`, `log` are already in scope in this file.)

- [ ] **Step 4: Register + announce the job in `src/utils/init/cron.ts`**

Update the imports to include `telemetryJob` and add `env` + the endpoint helper:

```ts
import { cleaningHealthcheckLogsJob, cleaningJob, healthcheckAgentAndDatabaseJob, retentionJob, telemetryJob } from "@/lib/tasks";
import { env } from "@/env.mjs";
import { getOtlpEndpoint } from "@/features/telemetry/constants";
```

Inside `setupCronJobs`, before the final `log.info("==== Cron jobs started ====")`, add:

```ts
    if (env.TELEMETRY) {
        telemetryJob.start();
        log.info({ endpoint: getOtlpEndpoint() }, "Telemetry enabled");
    }
```

- [ ] **Step 5: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no new errors.

- [ ] **Step 6: Verify orchestrator end-to-end**

Create `scratch-telemetry-check.ts` at the repo root:

```ts
import { runTelemetry } from "@/features/telemetry/run";

async function main() {
    await runTelemetry();
    console.log("runTelemetry completed");
    process.exit(0);
}
main();
```

Run: `NODE_ENV=development pnpm tsx scratch-telemetry-check.ts`
Expected: logs `Telemetry sent` with a hashed `instanceId`, then `runTelemetry completed`.

- [ ] **Step 7: Remove the scratch file**

```bash
rm scratch-telemetry-check.ts
```

- [ ] **Step 8: Verify the boot log (opt-out gate)**

Run: `pnpm dev` and watch startup output.
Expected: `Telemetry enabled` with the sandbox endpoint appears (since `TELEMETRY` defaults to true). Stop the dev server.
Then set `TELEMETRY=false` in `.env`, restart `pnpm dev`.
Expected: no `Telemetry enabled` line. Restore `TELEMETRY=true` afterwards.

- [ ] **Step 9: Commit**

```bash
git add src/features/telemetry/run.ts src/features/telemetry/index.ts src/lib/tasks/index.ts src/utils/init/cron.ts
git commit -m "feat(telemetry): runTelemetry orchestrator, 24h cron job, boot wiring"
```

---

## Task 9: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole unit-test suite**

Run: `pnpm test`
Expected: all telemetry tests pass (constants + anonymize).

- [ ] **Step 2: Typecheck + lint the whole project**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: no new errors or warnings introduced by the feature.

- [ ] **Step 3: Confirm no stray scratch files remain**

Run: `git status --porcelain`
Expected: clean (no `scratch-telemetry-check.ts`).

---

## Self-Review Notes

- **Spec coverage:** All 8 KPIs → Task 5 queries + Task 4 mapping. Anonymization → Task 4. Instance UUID (column + migration + populate) → Task 2. OTel export + per-env endpoint → Tasks 1 & 7. 24h cron + boot registration + logger announce → Task 8. Single `TELEMETRY` env var (default true) + `.env`/`.env.example` → Task 1. Zero-breakage (read-only queries, additive nullable column) → Tasks 2 & 5.
- **Type consistency:** `RawTelemetry`/`RawCount` defined in Task 5, consumed in Task 4 (type-only) and Task 6. `TelemetryPayload`/`DistributionEntry` defined in Task 3, consumed in Tasks 4, 7. `compileTelemetryAction` returns `{ data?: TelemetryPayload }`, unwrapped in Task 8. `getOtlpEndpoint`/`OTLP_METRICS_URL`/`SERVICE_NAME`/`TELEMETRY_METER_NAME` defined in Task 1, consumed in Tasks 7 & 8.
- **Build-order note:** Task 4 (anonymize) imports types from Task 5 (queries). Its test fully passes only after Task 5 exists — flagged in Task 4 Step 3 and re-run in Task 5 Step 5. If executing strictly in order, create Task 5's file before running Task 4's test, or swap the two tasks' order.
- **OTel API drift:** OpenTelemetry package APIs vary across versions (`resourceFromAttributes` vs `new Resource`, `createGauge` vs `createObservableGauge`, semantic-convention export names). Each affected step lists the fallback and relies on `pnpm tsc --noEmit` to confirm.
