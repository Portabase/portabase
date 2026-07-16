"use server";

import {z} from "zod";
import {and, count, eq, isNull} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {ServerActionResult} from "@/types/action-type";
import {userAction} from "@/lib/safe-actions/actions";
import {zString} from "@/lib/zod";
import {
    AgentOnlineError,
    assertCanDeleteDatabase,
    DatabaseNotFoundError,
    UnauthorizedError,
} from "@/features/database/utils/database-acl";

export const countDatabaseBackupsAction = userAction
    .schema(
        z.object({
            databaseId: zString(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<number>> => {
        try {
            await assertCanDeleteDatabase(parsedInput.databaseId);

            const [result] = await db
                .select({count: count()})
                .from(drizzleDb.schemas.backup)
                .where(
                    and(
                        eq(drizzleDb.schemas.backup.databaseId, parsedInput.databaseId),
                        eq(drizzleDb.schemas.backup.status, "success"),
                        isNull(drizzleDb.schemas.backup.deletedAt),
                    )
                );

            return {
                success: true,
                value: result?.count ?? 0,
            };
        } catch (error) {
            if (error instanceof AgentOnlineError) {
                return {
                    success: false,
                    actionError: {
                        message: "Agent must be offline to delete a database.",
                        status: 409,
                        messageParams: {databaseId: parsedInput.databaseId},
                    },
                };
            }

            if (error instanceof UnauthorizedError) {
                return {
                    success: false,
                    actionError: {
                        message: "Not authorized to read this database.",
                        status: 403,
                        messageParams: {databaseId: parsedInput.databaseId},
                    },
                };
            }

            if (error instanceof DatabaseNotFoundError) {
                return {
                    success: false,
                    actionError: {
                        message: "Database not found",
                        status: 404,
                        messageParams: {databaseId: parsedInput.databaseId},
                    },
                };
            }

            return {
                success: false,
                actionError: {
                    message: "Failed to count backups.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {databaseId: parsedInput.databaseId},
                },
            };
        }
    });
