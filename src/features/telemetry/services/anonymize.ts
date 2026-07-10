import { createHash } from "crypto";
import type { RawTelemetry, RawCount } from "@/features/telemetry/queries/telemetry.queries";
import {
    telemetryPayloadSchema,
    type DistributionEntry,
    type TelemetryPayload,
} from "@/features/telemetry/schemas/telemetry.schema";

export type AnonymizeContext = { secret: string; version: string; instanceId: string };

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
        instanceId: hashInstanceId(ctx.instanceId, ctx.secret),
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
