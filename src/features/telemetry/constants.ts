export const SERVICE_NAME = "portabase-dashboard";
export const TELEMETRY_METER_NAME = "portabase-telemetry";

// Fleet ingestion token for Portabase's OTLP collector. Shared across all
// instances and hardcoded on purpose — the "single TELEMETRY env var" constraint
// forbids per-instance config, and only anonymized aggregates are ever sent.
export const OTLP_AUTH_TOKEN =
    "4625713e72b4ec4eaac8a93716f3a83a3afc7fe17dfb8424c57aa82c459d4a8e";

export function getOtlpEndpoint(): string {
    return process.env.NODE_ENV === "production"
        ? "https://telemetry.portabase.io"
        : "http://localhost:4318";
  // : "https://sandbox.telemetry.portabase.io";
}

export function OTLP_METRICS_URL(): string {
    return `${getOtlpEndpoint()}/v1/metrics`;
}
