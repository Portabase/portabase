"use server";

import {z} from "zod";
import {Database} from "@/db/schema/07_database";
import {ServerActionResult} from "@/types/action-type";
import {userAction} from "@/lib/safe-actions/actions";
import {zString} from "@/lib/zod";
import {deleteDatabaseService} from "@/features/database/services/database-delete.service";
import {
    AgentOnlineError,
    DatabaseNotFoundError,
    UnauthorizedError,
} from "@/features/database/utils/database-acl";

export const deleteDatabaseAction = userAction
    .schema(
        z.object({
            databaseId: zString(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Database>> => {
        try {
            const {database, failedBackupCount} = await deleteDatabaseService(parsedInput);

            return {
                success: true,
                value: database,
                actionSuccess: {
                    message: "Database has been successfully deleted.",
                    messageParams: {
                        databaseId: parsedInput.databaseId,
                        failedBackupCount,
                    },
                },
            };
        } catch (error) {
            if (error instanceof AgentOnlineError) {
                return {
                    success: false,
                    actionError: {
                        message: "Agent must be offline to delete a database.",
                        status: 409,
                        messageParams: {
                            databaseId: parsedInput.databaseId,
                        },
                    },
                };
            }

            if (error instanceof UnauthorizedError) {
                return {
                    success: false,
                    actionError: {
                        message: "Not authorized to delete this database.",
                        status: 403,
                        messageParams: {
                            databaseId: parsedInput.databaseId,
                        },
                    },
                };
            }

            if (error instanceof DatabaseNotFoundError) {
                return {
                    success: false,
                    actionError: {
                        message: "Database not found or update failed",
                        status: 404,
                        messageParams: {
                            databaseId: parsedInput.databaseId,
                        },
                    },
                };
            }

            return {
                success: false,
                actionError: {
                    message: "Failed to delete database.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                    messageParams: {
                        databaseId: parsedInput.databaseId,
                    },
                },
            };
        }
    });
