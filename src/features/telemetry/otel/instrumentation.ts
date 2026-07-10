import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { env } from "@/env.mjs";
import { OTLP_AUTH_TOKEN, OTLP_METRICS_URL, SERVICE_NAME } from "@/features/telemetry/constants";

// In dev, surface OTLP export failures (connection refused, 4xx, auth) that
// forceFlush()/shutdown() otherwise swallow — the reason "Telemetry sent" can
// log while nothing reaches the collector.
if (process.env.NODE_ENV !== "production") {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

export function getMeterProvider(instanceId: string): MeterProvider {
    const exporter = new OTLPMetricExporter({
        url: OTLP_METRICS_URL(),
        headers: { Authorization: `Bearer ${OTLP_AUTH_TOKEN}` },
    });
    const reader = new PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: 24 * 60 * 60 * 1000,
    });
    return new MeterProvider({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: SERVICE_NAME,
            [ATTR_SERVICE_VERSION]: env.NEXT_PUBLIC_PROJECT_VERSION ?? "unknown",
            "service.instance.id": instanceId,
        }),
        readers: [reader],
    });
}
