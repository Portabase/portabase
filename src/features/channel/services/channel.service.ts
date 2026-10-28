import {and, count, desc, eq, inArray, isNull} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import type {NotificationChannel} from "@/db/schema/09_notification-channel";
import type {StorageChannel} from "@/db/schema/12_storage-channel";
import {withUpdatedAt} from "@/db/utils";
import type {
    NotificationChannelFormType,
    StorageChannelFormType,
} from "@/features/channel/schemas/channel-form.schema";
import {dispatchNotification} from "@/features/notifications/utils/notifications.dispatch";
import {dispatchStorage} from "@/features/storages/utils/storages.dispatch";

export type ChannelKind = "storage" | "notification";
export type ChannelOf<K extends ChannelKind> = K extends "storage" ? StorageChannel : NotificationChannel;
export type ChannelForm = StorageChannelFormType | NotificationChannelFormType;
export type ChannelPatch = { provider?: string; name?: string; config?: unknown; enabled?: boolean };

export type ChannelItem = {
    id: string;
    name: string;
    provider: string;
    enabled: boolean;
    owned: boolean;
    createdAt: Date;
    updatedAt: Date | null;
};

export type GlobalChannelItem = Omit<ChannelItem, "owned"> & { organizationIds: string[] };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const {
    storageChannel,
    notificationChannel,
    organizationStorageChannel,
    organizationNotificationChannel,
    backupStorage,
} = drizzleDb.schemas;

function channelTable(kind: ChannelKind) {
    return (kind === "storage" ? storageChannel : notificationChannel) as typeof storageChannel;
}

function junction(kind: ChannelKind) {
    return kind === "storage"
        ? {
            table: organizationStorageChannel,
            organizationId: organizationStorageChannel.organizationId,
            channelId: organizationStorageChannel.storageChannelId,
        }
        : {
            table: organizationNotificationChannel as unknown as typeof organizationStorageChannel,
            organizationId: organizationNotificationChannel.organizationId,
            channelId: organizationNotificationChannel.notificationChannelId as unknown as typeof organizationStorageChannel.storageChannelId,
        };
}

function safeColumns(kind: ChannelKind) {
    const t = channelTable(kind);
    return {
        id: t.id,
        name: t.name,
        provider: t.provider,
        enabled: t.enabled,
        organizationId: t.organizationId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    };
}

type SafeRow = {
    id: string;
    name: string;
    provider: string;
    enabled: boolean;
    organizationId: string | null;
    createdAt: Date;
    updatedAt: Date | null;
};

function toChannelItem(organizationId: string) {
    return ({organizationId: owner, ...row}: SafeRow): ChannelItem => ({...row, owned: owner === organizationId});
}

async function linkOrganizations(tx: Tx, kind: ChannelKind, id: string, organizationIds: string[]) {
    if (organizationIds.length === 0) return;
    if (kind === "storage") {
        await tx.insert(organizationStorageChannel).values(organizationIds.map((organizationId) => ({organizationId, storageChannelId: id})));
    } else {
        await tx.insert(organizationNotificationChannel).values(organizationIds.map((organizationId) => ({organizationId, notificationChannelId: id})));
    }
}

export async function createChannelService<K extends ChannelKind>(
    kind: K,
    organizationId: string | null,
    data: ChannelForm,
): Promise<ChannelOf<K>> {
    return db.transaction(async (tx) => {
        const [channel] = await tx
            .insert(channelTable(kind))
            .values({
                provider: data.provider as StorageChannel["provider"],
                name: data.name,
                config: data.config,
                enabled: data.enabled ?? true,
                organizationId,
            })
            .returning();
        if (organizationId) await linkOrganizations(tx, kind, channel.id, [organizationId]);
        return channel as unknown as ChannelOf<K>;
    });
}

export async function updateChannelService<K extends ChannelKind>(
    kind: K,
    id: string,
    patch: ChannelPatch,
): Promise<ChannelOf<K> | undefined> {
    const t = channelTable(kind);
    const values = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
    const [channel] = await db.update(t).set(withUpdatedAt(values)).where(eq(t.id, id)).returning();
    return channel as unknown as ChannelOf<K> | undefined;
}

export async function deleteChannelService<K extends ChannelKind>(kind: K, id: string): Promise<ChannelOf<K> | undefined> {
    const t = channelTable(kind);
    const [channel] = await db.delete(t).where(eq(t.id, id)).returning();
    return channel as unknown as ChannelOf<K> | undefined;
}

export async function setChannelOrganizationsService(
    kind: ChannelKind,
    id: string,
    organizationIds: string[],
): Promise<"not_found" | "ok"> {
    const t = channelTable(kind);
    const j = junction(kind);
    const [channel] = await db.select({id: t.id}).from(t).where(eq(t.id, id)).limit(1);
    if (!channel) return "not_found";

    const existing = (await db.select({organizationId: j.organizationId}).from(j.table).where(eq(j.channelId, id)))
        .map((row) => row.organizationId);
    const wanted = [...new Set(organizationIds)];
    const toAdd = wanted.filter((organizationId) => !existing.includes(organizationId));
    const toRemove = existing.filter((organizationId) => !wanted.includes(organizationId));

    await db.transaction(async (tx) => {
        await linkOrganizations(tx, kind, id, toAdd);
        if (toRemove.length > 0) {
            await tx.delete(j.table).where(and(eq(j.channelId, id), inArray(j.organizationId, toRemove)));
        }
    });
    return "ok";
}

export async function countStoredCopies(storageChannelId: string): Promise<number> {
    const [row] = await db
        .select({value: count()})
        .from(backupStorage)
        .where(eq(backupStorage.storageChannelId, storageChannelId));
    return row?.value ?? 0;
}

export async function getChannelOwner(
    kind: ChannelKind,
    id: string,
): Promise<{ organizationId: string | null; provider: string } | null> {
    const t = channelTable(kind);
    const [row] = await db
        .select({organizationId: t.organizationId, provider: t.provider})
        .from(t)
        .where(eq(t.id, id))
        .limit(1);
    return row ?? null;
}

export async function listOrganizationChannelsSafe(kind: ChannelKind, organizationId: string, id?: string): Promise<ChannelItem[]> {
    const t = channelTable(kind);
    const j = junction(kind);
    const rows = await db
        .select(safeColumns(kind))
        .from(j.table)
        .innerJoin(t, eq(j.channelId, t.id))
        .where(and(eq(j.organizationId, organizationId), id ? eq(t.id, id) : undefined))
        .orderBy(desc(t.createdAt));
    return rows.map(toChannelItem(organizationId));
}

export async function getOrganizationChannelSafe(kind: ChannelKind, organizationId: string, id: string): Promise<ChannelItem | null> {
    const [item] = await listOrganizationChannelsSafe(kind, organizationId, id);
    return item ?? null;
}

export async function listGlobalChannelsSafe(kind: ChannelKind, id?: string): Promise<GlobalChannelItem[]> {
    const t = channelTable(kind);
    const j = junction(kind);
    const rows = await db
        .select(safeColumns(kind))
        .from(t)
        .where(and(isNull(t.organizationId), id ? eq(t.id, id) : undefined))
        .orderBy(desc(t.createdAt));
    if (rows.length === 0) return [];

    const links = await db
        .select({channelId: j.channelId, organizationId: j.organizationId})
        .from(j.table)
        .where(inArray(j.channelId, rows.map((row) => row.id)));

    return rows.map(({organizationId: _owner, ...row}) => ({
        ...row,
        organizationIds: links.filter((link) => link.channelId === row.id).map((link) => link.organizationId),
    }));
}

export async function getGlobalChannelSafe(kind: ChannelKind, id: string): Promise<GlobalChannelItem | null> {
    const [item] = await listGlobalChannelsSafe(kind, id);
    return item ?? null;
}

export function redactSecrets(message: string, config: unknown): string {
    const secrets: string[] = [];
    const walk = (value: unknown) => {
        if (typeof value === "string") {
            if (value.length >= 4) secrets.push(value);
        } else if (value && typeof value === "object") {
            Object.values(value).forEach(walk);
        }
    };
    walk(config);
    return secrets
        .sort((a, b) => b.length - a.length)
        .reduce((text, secret) => text.split(secret).join("***"), message);
}

export async function testStoredChannelService(
    kind: ChannelKind,
    id: string,
    organizationId?: string,
): Promise<{ success: boolean; message: string }> {
    const t = channelTable(kind);
    const [channel] = await db.select({name: t.name, config: t.config}).from(t).where(eq(t.id, id)).limit(1);
    if (!channel) return {success: false, message: "Channel not found"};

    const result = kind === "storage"
        ? await dispatchStorage({action: "ping"}, undefined, id, undefined, organizationId)
        : await dispatchNotification(
            {title: "Test Channel", message: `We are testing channel ${channel.name}`, level: "info"},
            undefined,
            id,
            organizationId,
        );
    const message = (result as { message?: string }).message ?? result.error ?? "";
    return {success: result.success, message: redactSecrets(message, channel.config)};
}
