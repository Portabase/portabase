"use server";

import { z } from "zod";
import { action } from "@/lib/safe-actions/actions";
import { env } from "@/env.mjs";
import { collectRawTelemetry } from "@/features/telemetry/queries/telemetry.queries";
import { getOrCreateInstanceId } from "@/features/telemetry/services/instance-id";
import { buildTelemetryPayload } from "@/features/telemetry/services/anonymize";

export const compileTelemetryAction = action
    .schema(z.object({}))
    .action(async () => {
        const [raw, instanceId] = await Promise.all([
            collectRawTelemetry(),
            getOrCreateInstanceId(),
        ]);
        return buildTelemetryPayload(raw, {
            secret: env.PROJECT_SECRET,
            version: env.NEXT_PUBLIC_PROJECT_VERSION ?? "unknown",
            instanceId,
        });
    });
