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
