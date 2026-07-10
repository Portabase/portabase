import cron from "node-cron";
import { logger } from "@/lib/logger";
import { getOrCreateInstanceData } from "@/features/telemetry/services/instance-data";
import { runTelemetry } from "@/features/telemetry/run";
import { getOtlpEndpoint, PRIVACY_URL } from "@/features/telemetry/constants";
import { env } from "@/env.mjs";

const log = logger.child({ module: "telemetry/cron" });

function logFirstLaunchNotice(): void {
    log.warn(
        "\n" +
        "══════════════════════════════════════════════════════════════════════\n" +
        "  📡  PORTABASE TELEMETRY IS ENABLED (anonymous usage metrics)\n" +
        "\n" +
        "  Portabase sends anonymous, aggregated usage metrics to help us\n" +
        "  understand how it is used in production. Only counts and enum labels\n" +
        "  are sent — never personal data, database contents, names, hosts,\n" +
        "  credentials or configuration. The instance id is a random UUID,\n" +
        "  hashed before it ever leaves your server.\n" +
        "\n" +
        `  Details & what we collect:  ${PRIVACY_URL}\n` +
        "  Opt out anytime:            set TELEMETRY=false and restart\n" +
        "══════════════════════════════════════════════════════════════════════",
    );
}

export async function startTelemetryCron(): Promise<void> {
    const { schedule, created } = await getOrCreateInstanceData();

    if (created) {
        logFirstLaunchNotice();
    }

    cron.schedule(env.NODE_ENV === "production" ? schedule : "* * * * *", async () => {
        try {
            log.info({ job: "cron", name: "telemetryJob", schedule: env.NODE_ENV === "production" ? schedule : "* * * * *" }, "Telemetry Job started");
            await runTelemetry();
        } catch (err) {
            log.error({ job: "cron", name: "telemetryJob", error: err }, "Telemetry Job Error");
        }
    });

    log.info({ endpoint: getOtlpEndpoint(), schedule: env.NODE_ENV === "production" ? schedule : "* * * * *" }, "Telemetry enabled");
}
