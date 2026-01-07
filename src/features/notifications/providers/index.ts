"use server"
import type {ProviderKind, EventPayload, DispatchResult} from '../types';
import {sendSlack} from './slack';
import {sendSmtp} from './smtp';
import {sendDiscord} from "@/features/notifications/providers/discord";
import {sendTelegram} from "@/features/notifications/providers/telegram";
import {sendGotify} from "@/features/notifications/providers/gotify";
import {sendNtfy} from "@/features/notifications/providers/ntfy";
import {sendWebhook} from "@/features/notifications/providers/webhook";

const handlers: Record<
    ProviderKind,
    (config: any, payload: EventPayload) => Promise<DispatchResult>
> = {
    slack: sendSlack,
    smtp: sendSmtp,
    discord: sendDiscord,
    telegram: sendTelegram,
    gotify: sendGotify,
    ntfy: sendNtfy,
    webhook: sendWebhook
};

export async function dispatchViaProvider(
    kind: ProviderKind,
    config: any,
    payload: EventPayload,
    channelId: string
): Promise<DispatchResult> {
    const handler = handlers[kind];
    if (!handler) {
        return {
            success: false,
            channelId,
            provider: kind,
            error: `Unsupported provider: ${kind}`,
        };
    }

    try {
        return await handler(config, payload);
    } catch (err: any) {
        return {
            success: false,
            channelId,
            provider: kind,
            error: err.message || 'Unknown error',
        };
    }
}