import type { EventPayload, DispatchResult } from '../types';

type WebhookConfig = {
    webhookUrl: string;
    // new format
    webhookHeaders?: { key: string; value: string }[];
    // legacy format — kept for backward compat with existing saved configs
    webhookSecret?: string;
    webhookSecretHeader?: string;
};

export async function sendWebhook(
    config: WebhookConfig,
    payload: EventPayload
): Promise<DispatchResult> {
    const { webhookUrl, webhookHeaders, webhookSecret, webhookSecretHeader } = config;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Portabase-Notifier/1.0',
    };

    // New format: iterate custom headers array
    if (webhookHeaders && webhookHeaders.length > 0) {
        const RESERVED = new Set(['content-type', 'user-agent']);
        for (const { key, value } of webhookHeaders) {
            if (key && !RESERVED.has(key.toLowerCase())) headers[key] = value;
        }
    } else if (webhookSecret) {
        // Legacy format: single secret header pair
        headers[webhookSecretHeader || 'X-Webhook-Secret'] = webhookSecret;
    }

    const res = await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Webhook error: ${res.status} ${err}`);
    }

    return {
        success: true,
        provider: 'webhook',
        message: 'Sent to Webhook',
        response: await res.text(),
    };
}
