import cron from "node-cron";
import { logger } from "@/lib/logger";
import { getOrCreateInstanceData } from "@/features/telemetry/services/instance-data";
import { runTelemetry } from "@/features/telemetry/run";
import { getOtlpEndpoint } from "@/features/telemetry/constants";

const log = logger.child({ module: "telemetry/cron" });

export async function startTelemetryCron(): Promise<void> {
    const { schedule } = await getOrCreateInstanceData();
    // Dev: run every minute for fast feedback. Prod: this instance's random daily time.
    const effectiveSchedule =
        process.env.NODE_ENV === "production" ? schedule : "* * * * *";

    cron.schedule(effectiveSchedule, async () => {
        try {
            log.info({ job: "cron", name: "telemetryJob", schedule: effectiveSchedule }, "Telemetry Job started");
            await runTelemetry();
        } catch (err) {
            log.error({ job: "cron", name: "telemetryJob", error: err }, "Telemetry Job Error");
        }
    });

    log.info({ endpoint: getOtlpEndpoint(), schedule: effectiveSchedule }, "Telemetry enabled");
}
