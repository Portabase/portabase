import cron from "node-cron";
import { logger } from "@/lib/logger";
import { getOrCreateInstance } from "@/features/telemetry/services/instance";
import { runTelemetry } from "@/features/telemetry/run";
import { env } from "@/env.mjs";

const log = logger.child({ module: "telemetry/cron" });

export async function startTelemetryCron(): Promise<void> {
    const { schedule, created } = await getOrCreateInstance();

    if (created) {
      log.warn(
          "\n" +
          "══════════════════════════════════════════════════════════════════════\n" +
          "\n" +
          "  Portabase sends anonymous, aggregated usage metrics to help us\n" +
          "  understand how it is used in production. Only counts and enum labels\n" +
          "  are sent. Never personal data, database contents, names, hosts,\n" +
          "  credentials or configuration. The instance id is a random UUID,\n" +
          "  hashed before it ever leaves your server.\n" +
          "\n" +
        `  Details & what we collect:  https://portabase.io/privacy\n` +
          "\n" +
          "══════════════════════════════════════════════════════════════════════",
      );
    }

    cron.schedule(env.NODE_ENV === "production" ? schedule : "* * * * *", async () => {
        try {
            await runTelemetry();
        } catch (err) {
            log.error({ job: "cron", name: "telemetryJob", error: err }, "Telemetry Error");
        }
    });
}
