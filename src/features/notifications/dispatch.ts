"use server";
import {eq} from "drizzle-orm";
import {dispatchViaProvider} from "./providers";
import type {EventPayload, DispatchResult, EventKind} from "./types";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {notificationLog} from "@/db/schema/11_notification-log";
import {NotificationChannel} from "@/db/schema/09_notification-channel";
import {Json} from "drizzle-zod";

export async function dispatchNotification(
    payload: EventPayload,
    policyId?: string,
    channelId?: string,
    organizationId?: string
): Promise<DispatchResult> {
    try {
        let channel: NotificationChannel | null = null;

        if (policyId) {
            const policyDb = await db.query.alertPolicy.findFirst({
                where: eq(drizzleDb.schemas.alertPolicy.id, policyId),
                with: {
                    notificationChannel: true
                },
            });

            if (!policyDb || !policyDb.notificationChannel) {
                return {
                    success: false,
                    channelId: "",
                    provider: null,
                    error: "Policy or associated channel not found",
                };
            }

            if (!policyDb.enabled || !policyDb.notificationChannel.enabled) {
                return {
                    success: false,
                    channelId: policyDb.notificationChannel.id,
                    provider: policyDb.notificationChannel.provider as any,
                    error: "Policy or channel is disabled",
                };
            }

            channel = {
                ...policyDb.notificationChannel,
                config: policyDb.notificationChannel.config as Json,
            };
        }

        if (channelId) {
            const fetchedChannel = await db.query.notificationChannel.findFirst({
                where: eq(drizzleDb.schemas.notificationChannel.id, channelId),
            });

            if (!fetchedChannel) {
                return {
                    success: false,
                    channelId: channelId,
                    provider: null,
                    error: "Channel not found",
                };
            }

            channel = {
                ...fetchedChannel,
                config: fetchedChannel.config as Json,
            };
        }

        if (!channel) {
            return {
                success: false,
                channelId: channelId || "",
                provider: null,
                error: "No valid channel to dispatch notification",
            };
        }


        if (!channel.enabled) {
            return {
                success: false,
                channelId: channelId || "",
                provider: null,
                error: "Channel not active",
            };
        }

        const result = await dispatchViaProvider(
            channel.provider,
            channel.config,
            {...payload, timestamp: payload.timestamp || new Date()},
            channel.id
        );

        const [log] = await db
            .insert(notificationLog)
            .values({
                channelId: channel.id,
                policyId: policyId || null,
                organizationId: organizationId || null,

                provider: channel.provider,
                providerName: channel.name,
                event: payload.event as EventKind,

                title: payload.title,
                message: payload.message,
                level: payload.level,
                payload: payload.data || null,
                success: result.success,
                error: result.success ? null : result.error,
                providerResponse: result.response || null,
            })
            .returning({id: notificationLog.id});

        return {...result, channelId: channel.id};

    } catch (err: any) {
        return {
            success: false,
            channelId: channelId || "",
            provider: null,
            error: err?.message || "Unexpected error during dispatch",
        };
    }
}
