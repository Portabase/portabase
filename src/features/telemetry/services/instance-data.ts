import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { env } from "@/env.mjs";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "telemetry/instance-data" });

export type InstanceData = { id: string; schedule: string };

/**
 * Random daily cron ("<minute> <hour> * * *") picked once per instance, so the
 * fleet spreads its reports across the day instead of every instance hitting
 * the collector at the same time.
 */
function randomDailySchedule(): string {
    const minute = Math.floor(Math.random() * 60);
    const hour = Math.floor(Math.random() * 24);
    return `${minute} ${hour} * * *`;
}

/**
 * Read (or create) the anonymous telemetry instance data stored in
 * `<PRIVATE_PATH>/telemetry/data.json`: a stable UUID and a per-instance random
 * daily cron schedule. Mirrors the RSA master-key pattern. Idempotent, and
 * back-fills any missing field (e.g. a `schedule` on an older `data.json`).
 * No DB, no migration.
 */
export async function getOrCreateInstanceData(
    filePath = path.join(env.PRIVATE_PATH!, "telemetry", "data.json"),
): Promise<InstanceData> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    let data: Partial<InstanceData> = {};
    try {
        const raw = await fs.readFile(filePath, "utf8");
        data = JSON.parse(raw) as Partial<InstanceData>;
    } catch {
        // missing or unreadable file -> create fresh
    }

    const id = data.id ?? randomUUID();
    const schedule = data.schedule ?? randomDailySchedule();

    if (data.id !== id || data.schedule !== schedule) {
        await fs.writeFile(filePath, JSON.stringify({ id, schedule }, null, 2), { mode: 0o600 });
        log.info({ schedule }, "Persisted telemetry instance data");
    }

    return { id, schedule };
}
