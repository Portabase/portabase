"use server"
import type {ProviderKind, EventPayload, DispatchResult} from '@/features/notifications/types';
import {sendSlack} from './slack';
import {sendSmtp} from './smtp';
import {sendDiscord} from "@/features/channel/components/notifications/discord";
import {sendTelegram} from "@/features/channel/components/notifications/telegram";
import {sendGotify} from "@/features/channel/components/notifications/gotify";
import {sendNtfy} from "@/features/channel/components/notifications/ntfy";
import {sendWebhook} from "@/features/channel/components/notifications/webhook";
import {sendNextcloud} from "@/features/channel/components/notifications/nextcloud";
import {sendPushover} from "@/features/channel/components/notifications/pushover";
import {sendTeams} from "@/features/channel/components/notifications/teams"

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
    webhook: sendWebhook,
    nextcloud: sendNextcloud,
    teams: sendTeams,
    pushover: sendPushover,
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