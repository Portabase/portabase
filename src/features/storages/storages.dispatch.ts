"use server";

import {eq} from 'drizzle-orm';
import {Json} from "drizzle-zod";

import * as drizzleDb from '@/db';
import {db} from '@/db';
import type {StorageInput, StorageProviderKind, StorageResult,} from '@/features/storages/storages.types';
import {dispatchViaProvider} from "@/features/channel/storages";
import {StorageChannel} from "@/db/schema/12_storage-channel";
import {
    StorageChannelFormType
} from "@/features/channel/channel-form.schema";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "features/storages/dispatch" });


export async function dispatchStorage(
    input: StorageInput,
    policyId?: string,
    channelId?: string,
    channelData?: StorageChannelFormType,
    organizationId?: string
): Promise<StorageResult> {
    try {

        let channel: StorageChannel | null = null;

        if (policyId) {
            const policyDb = await db.query.storagePolicy.findFirst({
                where: eq(drizzleDb.schemas.storagePolicy.id, policyId),
                with: {
                    storageChannel: true
                },
            });

            if (!policyDb || !policyDb.storageChannel) {
                return {
                    success: false,
                    provider: null,
                    error: "Policy or associated channel not found",
                };
            }

            if (!policyDb.enabled || !policyDb.storageChannel.enabled) {
                return {
                    success: false,
                    provider: policyDb.storageChannel.provider as any,
                    error: "Policy or channel is disabled",
                };
            }

            channel = {
                ...policyDb.storageChannel,
                config: policyDb.storageChannel.config as Json,
            };
        }


        if (channelId) {
            const fetchedChannel = await db.query.storageChannel.findFirst({
                where: eq(drizzleDb.schemas.storageChannel.id, channelId),
            });

            if (!fetchedChannel) {
                return {
                    success: false,
                    provider: null,
                    error: "Channel not found",
                };
            }

            channel = {
                ...fetchedChannel,
                config: fetchedChannel.config as Json,
            };
        }

        if (channelData) {
            // @ts-expect-error — channelData shape is not fully compatible with StorageChannel
            channel = {...channelData, config: channelData.config as Json};
        }

        if (!channel) {
            return {
                success: false,
                provider: null,
                error: "No valid channel to dispatch on storage",
            };
        }


        if (!channel.enabled) {
            return {
                success: false,
                provider: null,
                error: "Channel not active",
            };
        }


        const dispatchResult = await dispatchViaProvider(
            channel.provider as StorageProviderKind,
            channel.config,
            input,
        );

        log.debug({ result: dispatchResult }, "Storage dispatch result");
        return dispatchResult;

    } catch (err: any) {
        return {
            success: false,
            provider: null,
            error: err.message || 'Unexpected storage dispatch error',
        };
    }
}
