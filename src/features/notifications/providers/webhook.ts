import type {EventPayload, DispatchResult} from '../types';

export async function sendWebhook(
    config: { webhookUrl: string; webhookSecret?: string; webhookSecretHeader?: string },
    payload: EventPayload
): Promise<DispatchResult> {
    const {webhookUrl, webhookSecret, webhookSecretHeader} = config;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Portabase-Notifier/1.0'
    };

    if (webhookSecret) {
        headers[webhookSecretHeader || 'X-Webhook-Secret'] = webhookSecret;
    }

    const res = await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: headers,
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
