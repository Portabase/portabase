import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { env } from "@/env.mjs";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "telemetry/instance-id" });

/**
 * Read (or create) the anonymous instance UUID stored in
 * `<PRIVATE_PATH>/telemetry/data.json`. Mirrors the RSA master-key pattern.
 * Idempotent: the same id is returned across boots. No DB, no migration.
 */
export async function getOrCreateInstanceId(
    filePath = path.join(env.PRIVATE_PATH!, "telemetry", "data.json"),
): Promise<string> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    try {
        const raw = await fs.readFile(filePath, "utf8");
        const parsed = JSON.parse(raw) as { id?: string };
        if (parsed.id) return parsed.id;
    } catch {
        // missing or unreadable file -> fall through and create it
    }

    const id = randomUUID();
    await fs.writeFile(filePath, JSON.stringify({ id }, null, 2), { mode: 0o600 });
    log.info("Created telemetry instance id");
    return id;
}
