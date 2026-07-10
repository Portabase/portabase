import cron from "node-cron";
import { logger } from "@/lib/logger";
import { getOrCreateInstanceData } from "@/features/telemetry/services/instance-data";
import { runTelemetry } from "@/features/telemetry/run";
import { getOtlpEndpoint } from "@/features/telemetry/constants";

const log = logger.child({ module: "telemetry/cron" });

/**
 * Schedule the daily telemetry job at this instance's random time. Only called
 * when env.TELEMETRY is true, so nothing is armed when opted out (node-cron
 * auto-starts a task on schedule(), hence we schedule lazily here rather than
 * at module load).
 */
export async function startTelemetryCron(): Promise<void> {
    const { schedule } = await getOrCreateInstanceData();

    cron.schedule(schedule, async () => {
        try {
            log.info({ job: "cron", name: "telemetryJob", schedule }, "Telemetry Job started");
            await runTelemetry();
        } catch (err) {
            log.error({ job: "cron", name: "telemetryJob", error: err }, "Telemetry Job Error");
        }
    });

    log.info({ endpoint: getOtlpEndpoint(), schedule }, "Telemetry enabled");
}
