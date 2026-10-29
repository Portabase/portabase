import {and, asc, eq, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {type PolicyScope, scopeOwner} from "@/features/database/schemas/policy-scope.schema";
import type {AlertPolicyInput, StoragePolicyInput} from "@/lib/api-v1/validation/channel-policy";

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type PolicyChannel = { id: string; name: string; provider: string; enabled: boolean };

export type StoragePolicyItem = {
    id: string;
    storageChannelId: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date | null;
    channel: PolicyChannel;
};

export type AlertPolicyItem = Omit<StoragePolicyItem, "storageChannelId"> & {
    notificationChannelId: string;
    eventKinds: string[];
};

const {storagePolicy, alertPolicy, storageChannel, notificationChannel} = drizzleDb.schemas;

function storageOwnerWhere(scope: PolicyScope) {
    return scope.type === "database"
        ? and(eq(storagePolicy.databaseId, scope.id), isNull(storagePolicy.projectId))
        : and(eq(storagePolicy.projectId, scope.id), isNull(storagePolicy.databaseId));
}

function alertOwnerWhere(scope: PolicyScope) {
    return scope.type === "database"
        ? and(eq(alertPolicy.databaseId, scope.id), isNull(alertPolicy.projectId))
        : and(eq(alertPolicy.projectId, scope.id), isNull(alertPolicy.databaseId));
}

export async function listStoragePoliciesService(scope: PolicyScope, executor: Executor = db): Promise<StoragePolicyItem[]> {
    return executor
        .select({
            id: storagePolicy.id,
            storageChannelId: storagePolicy.storageChannelId,
            enabled: storagePolicy.enabled,
            createdAt: storagePolicy.createdAt,
            updatedAt: storagePolicy.updatedAt,
            channel: {
                id: storageChannel.id,
                name: storageChannel.name,
                provider: storageChannel.provider,
                enabled: storageChannel.enabled,
            },
        })
        .from(storagePolicy)
        .innerJoin(storageChannel, eq(storagePolicy.storageChannelId, storageChannel.id))
        .where(storageOwnerWhere(scope))
        .orderBy(asc(storagePolicy.createdAt), asc(storageChannel.name));
}

export async function replaceStoragePoliciesService(
    scope: PolicyScope,
    items: StoragePolicyInput[],
): Promise<StoragePolicyItem[]> {
    return db.transaction(async (tx) => {
        await tx.delete(storagePolicy).where(storageOwnerWhere(scope));
        if (items.length > 0) {
            await tx.insert(storagePolicy).values(
                items.map((item) => ({
                    ...scopeOwner(scope),
                    storageChannelId: item.storageChannelId,
                    enabled: item.enabled,
                })),
            );
        }
        return listStoragePoliciesService(scope, tx);
    });
}

export async function listAlertPoliciesService(scope: PolicyScope, executor: Executor = db): Promise<AlertPolicyItem[]> {
    return executor
        .select({
            id: alertPolicy.id,
            notificationChannelId: alertPolicy.notificationChannelId,
            eventKinds: alertPolicy.eventKinds,
            enabled: alertPolicy.enabled,
            createdAt: alertPolicy.createdAt,
            updatedAt: alertPolicy.updatedAt,
            channel: {
                id: notificationChannel.id,
                name: notificationChannel.name,
                provider: notificationChannel.provider,
                enabled: notificationChannel.enabled,
            },
        })
        .from(alertPolicy)
        .innerJoin(notificationChannel, eq(alertPolicy.notificationChannelId, notificationChannel.id))
        .where(alertOwnerWhere(scope))
        .orderBy(asc(alertPolicy.createdAt), asc(notificationChannel.name));
}

export async function replaceAlertPoliciesService(scope: PolicyScope, items: AlertPolicyInput[]): Promise<AlertPolicyItem[]> {
    return db.transaction(async (tx) => {
        await tx.delete(alertPolicy).where(alertOwnerWhere(scope));
        if (items.length > 0) {
            await tx.insert(alertPolicy).values(
                items.map((item) => ({
                    ...scopeOwner(scope),
                    notificationChannelId: item.notificationChannelId,
                    eventKinds: [...new Set(item.eventKinds)],
                    enabled: item.enabled,
                })),
            );
        }
        return listAlertPoliciesService(scope, tx);
    });
}
