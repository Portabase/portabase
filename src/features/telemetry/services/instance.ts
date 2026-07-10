import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { env } from "@/env.mjs";

export type InstanceData = { id: string; schedule: string; created: boolean };

function randomDailySchedule(): string {
    const minute = Math.floor(Math.random() * 60);
    const hour = Math.floor(Math.random() * 24);
    return `${minute} ${hour} * * *`;
}

export async function getOrCreateInstance(
    filePath = path.join(env.PRIVATE_PATH!, "telemetry", "data.json"),
): Promise<InstanceData> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    let data: Partial<InstanceData> = {};
    try {
        const raw = await fs.readFile(filePath, "utf8");
        data = JSON.parse(raw) as Partial<InstanceData>;
    } catch {
    }

    const created = !data.id;
    const id = data.id ?? randomUUID();
    const schedule = data.schedule ?? randomDailySchedule();

    if (data.id !== id || data.schedule !== schedule) {
        await fs.writeFile(filePath, JSON.stringify({ id, schedule }, null, 2), { mode: 0o600 });
    }

    return { id, schedule, created };
}
