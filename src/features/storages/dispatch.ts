"use server";

import {eq} from 'drizzle-orm';
import {Json} from "drizzle-zod";

import * as drizzleDb from '@/db';
import {db} from '@/db';
import type {StorageInput, StorageProviderKind, StorageResult,} from './types';
import {dispatchViaProvider} from "@/features/storages/providers";
import {StorageChannel} from "@/db/schema/12_storage-channel";
import {
    StorageChannelFormType
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/channel-form.schema";


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

        if (channelData) channel = {...channelData, config: channelData.config as Json};

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


        return await dispatchViaProvider(
            channel.provider as StorageProviderKind,
            channel.config,
            input,
        );


    } catch (err: any) {
        return {
            success: false,
            provider: null,
            error: err.message || 'Unexpected storage dispatch error',
        };
    }
}
