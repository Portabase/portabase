import { createHash } from "crypto";
import type { RawTelemetry, RawCount } from "@/features/telemetry/queries/telemetry.queries";
import {
    telemetryPayloadSchema,
    type DistributionEntry,
    type TelemetryPayload,
} from "@/features/telemetry/schemas/telemetry.schema";

export type AnonymizeContext = { secret: string; version: string; instanceId: string };

export function hashInstanceId(instanceId: string, secret: string): string {
    return createHash("sha256").update(`${instanceId}${secret}`).digest("hex");
}

function mapDistribution(rows: RawCount[]): DistributionEntry[] {
    return rows.map((r) => ({
        label: r.key ?? "unknown",
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
        storageByBackend: mapDistribution(raw.storageByBackend),
        notificationsByChannel: mapDistribution(raw.notificationsByChannel),
        agentsByVersion: mapDistribution(raw.agentsByVersion),
        encryptionEnabled: raw.encryptionEnabled,
    };
    return telemetryPayloadSchema.parse(payload);
}
