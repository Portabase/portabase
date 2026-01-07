import type {EventPayload, DispatchResult} from '../types';

export async function sendDiscord(
    config: { discordWebhook: string },
    payload: EventPayload
): Promise<DispatchResult> {
    const {discordWebhook: webhookUrl} = config;

    const embeds = [
        {
            title: `[${payload.level.toUpperCase()}] ${payload.title}`,
            description: payload.message,
            color: payload.level === 'critical' ? 15158332 : payload.level === 'warning' ? 16776960 : 3447003,
            fields: payload.data ? [
                {
                    name: 'Data',
                    value: `
                    ${JSON.stringify(payload.data, null, 2).substring(0, 1000)}
                    `,
                    inline: false
                }
            ] : [],
            timestamp: new Date().toISOString(),
        }
    ];

    const body = {
        embeds,
    };

    const res = await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Discord error: ${res.status} ${err}`);
    }

    return {
        success: true,
        provider: 'discord',
        message: 'Sent to Discord',
        response: res.statusText,
    };
}
