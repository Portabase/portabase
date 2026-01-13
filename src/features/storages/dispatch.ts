"use server";

import {eq} from 'drizzle-orm';
import * as drizzleDb from '@/db';
import {db} from '@/db';
import type {StorageInput, StorageProviderKind, StorageResult,} from './types';
import {dispatchViaProvider} from "@/features/storages/providers";

export async function dispatchStorage(
    input: StorageInput,
    policyId?: string,
    channelId?: string,
    organizationId?: string
): Promise<StorageResult> {
    try {
        if (!channelId) {



            return {
                success: false,
                provider: null,
                error: 'No storage channel provided',
            };
        }

        const channel = await db.query.storageChannel.findFirst({
            where: eq(drizzleDb.schemas.storageChannel.id, channelId),
        });

        if (!channel || !channel.enabled) {
            return {
                success: false,
                provider: channel?.provider as StorageProviderKind,
                error: 'Storage channel not found or disabled',
            };
        }

        return await dispatchViaProvider(
            channel.provider as StorageProviderKind,
            channel.config,
            input
        );
    } catch (err: any) {
        return {
            success: false,
            provider: null,
            error: err.message || 'Unexpected storage dispatch error',
        };
    }
}
