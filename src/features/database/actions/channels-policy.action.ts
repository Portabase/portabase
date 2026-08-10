"use server"
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {ServerActionResult} from "@/types/action-type";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {and, eq, inArray, isNull} from "drizzle-orm";
import {withUpdatedAt} from "@/db/utils";
import {AlertPolicy} from "@/db/schema/10_alert-policy";
import {PolicySchema} from "@/features/database/schemas/channels-policy.schema";
import {StoragePolicy} from "@/db/schema/13_storage-policy";
import {PolicyScope, PolicyScopeSchema, scopeOwner} from "@/features/database/schemas/policy-scope.schema";

const alertOwnerWhere = (scope: PolicyScope) =>
    scope.type === "database"
        ? and(eq(drizzleDb.schemas.alertPolicy.databaseId, scope.id), isNull(drizzleDb.schemas.alertPolicy.projectId))
        : and(eq(drizzleDb.schemas.alertPolicy.projectId, scope.id), isNull(drizzleDb.schemas.alertPolicy.databaseId));

const storageOwnerWhere = (scope: PolicyScope) =>
    scope.type === "database"
        ? and(eq(drizzleDb.schemas.storagePolicy.databaseId, scope.id), isNull(drizzleDb.schemas.storagePolicy.projectId))
        : and(eq(drizzleDb.schemas.storagePolicy.projectId, scope.id), isNull(drizzleDb.schemas.storagePolicy.databaseId));


export const createAlertPoliciesAction = userAction
    .inputSchema(
        z.object({
            scope: PolicyScopeSchema,
            alertPolicies: z.array(PolicySchema),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<AlertPolicy[]>> => {
        try {

            const owner = scopeOwner(parsedInput.scope);
            const valuesToInsert = parsedInput.alertPolicies.map((policy) => ({
                ...owner,
                notificationChannelId: policy.channelId,
                eventKinds: policy.eventKinds!,
                enabled: policy.enabled,
            }));

            const insertedPolicies = await db
                .insert(drizzleDb.schemas.alertPolicy)
                .values(valuesToInsert)
                .returning();

            return {
                success: true,
                value: insertedPolicies,
                actionSuccess: {
                    message: `Alert policies successfully added`,
                },
            };

        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to add policies.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });


export const updateAlertPoliciesAction = userAction
    .inputSchema(
        z.object({
            scope: PolicyScopeSchema,
            alertPolicies: z.array(PolicySchema),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<AlertPolicy[]>> => {
        const {scope, alertPolicies} = parsedInput;

        try {

            const updatedPolicies = await db.transaction(async (tx) => {
                const results: AlertPolicy[] = [];
                for (const policy of alertPolicies) {
                    const {channelId: notificationChannelId, ...updateData} = policy;

                    const updated = await tx
                        .update(drizzleDb.schemas.alertPolicy)
                        .set(withUpdatedAt({
                            ...updateData,
                        }))
                        .where(
                            and(
                                eq(drizzleDb.schemas.alertPolicy.notificationChannelId, notificationChannelId),
                                alertOwnerWhere(scope)
                            )
                        )
                        .returning();

                    if (updated[0]) {
                        results.push(updated[0]);
                    }
                }

                return results;
            });

            if (updatedPolicies.length === 0) {
                return {
                    success: false,
                    actionError: {message: "No policies were updated."},
                };
            }

            return {
                success: true,
                value: updatedPolicies,
                actionSuccess: {
                    message: `Successfully updated ${updatedPolicies.length} alert policy(ies).`,
                },
            };
        } catch (error) {
            console.error("Update alert policies failed:", error);
            return {
                success: false,
                actionError: {
                    message: "Failed to update alert policies.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });


export const deleteAlertPoliciesAction = userAction
    .inputSchema(
        z.object({
            scope: PolicyScopeSchema,
            alertPolicies: z.array(PolicySchema),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<AlertPolicy[]>> => {
        const {scope, alertPolicies} = parsedInput;

        try {

            const notificationChannelIds = alertPolicies.map((alertPolicy) => alertPolicy.channelId);

            const policiesToDelete = await db
                .select()
                .from(drizzleDb.schemas.alertPolicy)
                .where(
                    and(
                        alertOwnerWhere(scope),
                        inArray(drizzleDb.schemas.alertPolicy.notificationChannelId, notificationChannelIds)
                    )
                );

            if (policiesToDelete.length === 0) {
                return {
                    success: false,
                    actionError: {message: "No alert policies found to delete."},
                };
            }

            await db
                .delete(drizzleDb.schemas.alertPolicy)
                .where(
                    and(
                        alertOwnerWhere(scope),
                        inArray(drizzleDb.schemas.alertPolicy.notificationChannelId, notificationChannelIds)
                    )
                );

            return {
                success: true,
                value: policiesToDelete,
                actionSuccess: {
                    message: `Successfully deleted ${policiesToDelete.length} alert policy(ies).`,
                },
            };
        } catch (error) {
            console.error("Delete alert policies failed:", error);
            return {
                success: false,
                actionError: {
                    message: "Failed to delete alert policies.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });


export const createStoragePoliciesAction = userAction
    .inputSchema(
        z.object({
            scope: PolicyScopeSchema,
            storagePolicies: z.array(PolicySchema),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<StoragePolicy[]>> => {
        try {

            const owner = scopeOwner(parsedInput.scope);
            const valuesToInsert = parsedInput.storagePolicies.map((policy) => ({
                ...owner,
                storageChannelId: policy.channelId,
                enabled: policy.enabled,
            }));


            const insertedPolicies = await db
                .insert(drizzleDb.schemas.storagePolicy)
                .values(valuesToInsert)
                .returning();

            return {
                success: true,
                value: insertedPolicies,
                actionSuccess: {
                    message: `Storage policies successfully added`,
                },
            };

        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to add policies.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });


export const updateStoragePoliciesAction = userAction
    .inputSchema(
        z.object({
            scope: PolicyScopeSchema,
            storagePolicies: z.array(PolicySchema),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<StoragePolicy[]>> => {
        const {scope, storagePolicies} = parsedInput;

        try {

            const updatedPolicies = await db.transaction(async (tx) => {
                const results: StoragePolicy[] = [];
                for (const policy of storagePolicies) {
                    const {channelId: storageChannelId, ...updateData} = policy;

                    const updated = await tx
                        .update(drizzleDb.schemas.storagePolicy)
                        .set(withUpdatedAt({
                            ...updateData,
                        }))
                        .where(
                            and(
                                eq(drizzleDb.schemas.storagePolicy.storageChannelId, storageChannelId),
                                storageOwnerWhere(scope)
                            )
                        )
                        .returning();

                    if (updated[0]) {
                        results.push(updated[0]);
                    }
                }

                return results;
            });

            if (updatedPolicies.length === 0) {
                return {
                    success: false,
                    actionError: {message: "No policies were updated."},
                };
            }

            return {
                success: true,
                value: updatedPolicies,
                actionSuccess: {
                    message: `Successfully updated ${updatedPolicies.length} storage policy(ies).`,
                },
            };
        } catch (error) {
            console.error("Update storage policies failed:", error);
            return {
                success: false,
                actionError: {
                    message: "Failed to update storage policies.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });


export const deleteStoragePoliciesAction = userAction
    .inputSchema(
        z.object({
            scope: PolicyScopeSchema,
            storagePolicies: z.array(PolicySchema),
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<StoragePolicy[]>> => {
        const {scope, storagePolicies} = parsedInput;

        try {

            const storageChannelIds = storagePolicies.map((storagePolicy) => storagePolicy.channelId);

            const policiesToDelete = await db
                .select()
                .from(drizzleDb.schemas.storagePolicy)
                .where(
                    and(
                        storageOwnerWhere(scope),
                        inArray(drizzleDb.schemas.storagePolicy.storageChannelId, storageChannelIds)
                    )
                );

            if (policiesToDelete.length === 0) {
                return {
                    success: false,
                    actionError: {message: "No storage policies found to delete."},
                };
            }

            await db
                .delete(drizzleDb.schemas.storagePolicy)
                .where(
                    and(
                        storageOwnerWhere(scope),
                        inArray(drizzleDb.schemas.storagePolicy.storageChannelId, storageChannelIds)
                    )
                );

            return {
                success: true,
                value: policiesToDelete,
                actionSuccess: {
                    message: `Successfully deleted ${policiesToDelete.length} storage policy(ies).`,
                },
            };
        } catch (error) {
            console.error("Delete storage policies failed:", error);
            return {
                success: false,
                actionError: {
                    message: "Failed to delete storage policies.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });
