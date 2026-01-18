"use server"
import {eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db} from "@/db";

export async function getDatabaseBackups(databaseId: string) {
    return await db.query.backup.findMany({
        where: eq(drizzleDb.schemas.backup.databaseId, databaseId),
        with: {
            restorations: true,
            storages: {
                with: {
                    storageChannel: true,
                },
            },
        },
        orderBy: (b, {desc}) => [desc(b.createdAt)],
    });
}
