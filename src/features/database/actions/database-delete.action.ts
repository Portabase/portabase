"use server";

import {z} from "zod";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {Database} from "@/db/schema/07_database";
import {ServerActionResult} from "@/types/action-type";
import {userAction} from "@/lib/safe-actions/actions";
import {zString} from "@/lib/zod";
import {withUpdatedAt} from "@/db/utils";
import {currentUser} from "@/lib/auth/current-user";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {computeOrganizationPermissions} from "@/lib/acl/organization-acl";

type DeleteDatabaseInput = {
    databaseId: string;
};

class DatabaseNotFoundError extends Error {
    constructor(databaseId: string) {
        super(`Database not found or update failed: ${databaseId}`);
        this.name = "DatabaseNotFoundError";
    }
}

class UnauthorizedError extends Error {
    constructor(databaseId: string) {
        super(`Not authorized to delete this database: ${databaseId}`);
        this.name = "UnauthorizedError";
    }
}

async function assertCanDeleteDatabase(databaseId: string): Promise<void> {
    const database = await db.query.database.findFirst({
        where: eq(drizzleDb.schemas.database.id, databaseId),
        with: {
            agent: true,
        },
    });

    if (!database || !database.agent) {
        throw new DatabaseNotFoundError(databaseId);
    }

    const user = await currentUser();
    if (!user) {
        throw new UnauthorizedError(databaseId);
    }

    const agent = database.agent;
    const isAdmin = user.role === "superadmin" || user.role === "admin";

    let authorized: boolean;
    if (agent.organizationId === null) {
        authorized = isAdmin;
    } else {
        const organization = await getOrganization({});
        const activeMember = await getActiveMember();
        const canManage = activeMember
            ? computeOrganizationPermissions(activeMember).canManageAgents
            : false;

        const hasAccess =
            !!organization && agent.organizationId === organization.id;
        authorized = canManage && hasAccess;
    }

    if (!authorized) {
        throw new UnauthorizedError(databaseId);
    }
}

export async function deleteDatabaseService(input: DeleteDatabaseInput): Promise<Database> {
    const {databaseId} = input;

    await assertCanDeleteDatabase(databaseId);

    await db
        .delete(drizzleDb.schemas.retentionPolicy)
        .where(eq(drizzleDb.schemas.retentionPolicy.databaseId, databaseId))
        .execute();

    await db
        .delete(drizzleDb.schemas.alertPolicy)
        .where(eq(drizzleDb.schemas.alertPolicy.databaseId, databaseId))
        .execute();

    await db
        .delete(drizzleDb.schemas.storagePolicy)
        .where(eq(drizzleDb.schemas.storagePolicy.databaseId, databaseId))
        .execute();

    const [updatedDatabase] = await db
        .update(drizzleDb.schemas.database)
        .set(
            withUpdatedAt({
                agentId: null,
                agentDatabaseId: null,
                projectId: null,
                backupPolicy: null,
                deletedAt: new Date(),
            })
        )
        .where(eq(drizzleDb.schemas.database.id, databaseId))
        .returning();

    if (!updatedDatabase) {
        throw new DatabaseNotFoundError(databaseId);
    }

    return updatedDatabase;
}

export const deleteDatabaseAction = userAction
    .schema(
        z.object({
            databaseId: zString(),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Database>> => {
        try {
            const deletedDatabase = await deleteDatabaseService(parsedInput);

            return {
                success: true,
                value: deletedDatabase,
                actionSuccess: {
                    message: "Database has been successfully deleted.",
                    messageParams: {
                        databaseId: parsedInput.databaseId,
                    },
                },
            };
        } catch (error) {
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
