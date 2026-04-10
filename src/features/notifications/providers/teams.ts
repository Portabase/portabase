import type {EventPayload, DispatchResult} from '../types';

function safeStringify(data: Record<string, any>): string {
    const seen = new WeakSet();
    return JSON.stringify(data, (_key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]';
            seen.add(value);
        }
        return value;
    }, 2);
}

export async function sendTeams(
    config: { teamsWebhook: string },
    payload: EventPayload
): Promise<DispatchResult> {
    const {teamsWebhook: webhookUrl} = config;

    const body = {
        type: 'message',
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: {
                    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                    type: 'AdaptiveCard',
                    version: '1.4',
                    body: [
                        {
                            type: 'TextBlock',
                            size: 'medium',
                            weight: 'bolder',
                            text: `[${payload.level.toUpperCase()}] ${payload.title}`,
                        },
                        {
                            type: 'TextBlock',
                            text: payload.message,
                            wrap: true,
                        },
                        ...(payload.data
                            ? [
                                {
                                    type: 'TextBlock',
                                    text: `Data: ${safeStringify(payload.data)}`,
                                    fontType: 'monospace',
                                    wrap: true,
                                },
                            ]
                            : []),
                    ],
                },
            },
        ],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'},
            signal: controller.signal,
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Teams error: ${res.status} ${err}`);
        }

        return {
            success: true,
            provider: 'microsoft-teams',
            message: 'Sent to Microsoft Teams',
            response: await res.text(),
        };
    } finally {
        clearTimeout(timeout);
    }
}
