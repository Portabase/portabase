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
