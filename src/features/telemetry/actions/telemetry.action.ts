"use server";

import { z } from "zod";
import { action } from "@/lib/safe-actions/actions";
import { env } from "@/env.mjs";
import { collectRawTelemetry } from "@/features/telemetry/queries/telemetry.queries";
import { getOrCreateInstance } from "@/features/telemetry/services/instance";
import { buildTelemetryPayload } from "@/features/telemetry/services/anonymize";

export const compileTelemetryAction = action
    .schema(z.object({}))
    .action(async () => {
        const [raw, instance] = await Promise.all([
            collectRawTelemetry(),
            getOrCreateInstance(),
        ]);
        return buildTelemetryPayload(raw, {
            secret: env.PROJECT_SECRET,
            version: env.NEXT_PUBLIC_PROJECT_VERSION ?? "unknown",
            instanceId: instance.id,
        });
    });
