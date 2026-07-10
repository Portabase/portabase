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

    // OTel-official dotted metric names. SigNoz preserves them as-is; the
    // dashboard (signoz-dashboard.json) must query the same dotted names.
    meter.createGauge("portabase.users.total").record(payload.usersTotal);
    meter.createGauge("portabase.organizations.total").record(payload.orgsTotal);
    meter.createGauge("portabase.agents.total").record(payload.agentsTotal);
    meter.createGauge("portabase.databases.total").record(payload.databasesTotal);

    meter
        .createGauge("portabase.instance.info")
        .record(1, { dashboard_version: payload.dashboardVersion });

    meter.createGauge("portabase.encryption.enabled").record(payload.encryptionEnabled ? 1 : 0);

    recordDistribution(meter, "portabase.databases.by_type", "db_type", payload.databasesByType);
    recordDistribution(meter, "portabase.storage.backends", "backend", payload.storageByBackend);
    recordDistribution(meter, "portabase.notification.channels", "channel", payload.notificationsByChannel);
    recordDistribution(meter, "portabase.agents.by_version", "agent_version", payload.agentsByVersion);

    await provider.forceFlush();
    await provider.shutdown();
}
