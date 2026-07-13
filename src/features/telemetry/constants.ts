export const SERVICE_NAME = "portabase-dashboard";
export const TELEMETRY_METER_NAME = "portabase-telemetry";

// NOTE: This token is intentionally in plaintext, it's a write-only telemetry
// ingestion token (send-only, no read access), so it's public by design, just
// like a Sentry DSN or a PostHog public key. Not a leaked secret.
export const OTLP_AUTH_TOKEN =
    "4625713e72b4ec4eaac8a93716f3a83a3afc7fe17dfb8424c57aa82c459d4a8e";

export function getOtlpEndpoint(): string {
    return process.env.NODE_ENV === "production"
        ? "https://telemetry.portabase.io"
       : "http://localhost:4318"
}
