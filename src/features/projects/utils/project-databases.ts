import type {Database} from "@/db/schema/07_database";
import {getLatestBackups} from "@/db/services/backup";
import {getLiveness} from "@/features/agents/utils/status/agent-status";

export async function withLastBackupAndLiveness(databases: Database[]) {
    const latestBackups = await getLatestBackups(databases.map((database) => database.id));
    return databases.map((database) => {
        const lastBackup = latestBackups.get(database.id) ?? null;
        return {
            ...database,
            lastBackup,
            lastBackupStatus: lastBackup?.status ?? "none",
            liveness: getLiveness(database.lastContact),
        };
    });
}

export type ProjectDatabase = Awaited<ReturnType<typeof withLastBackupAndLiveness>>[number];
