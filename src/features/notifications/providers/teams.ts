import type {EventPayload, DispatchResult} from '../types';

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
                                    text: `Data: ${JSON.stringify(payload.data, null, 2)}`,
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

    const res = await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Teams error: ${res.status} ${err}`);
    }

    return {
        success: true,
        provider: 'teams',
        message: 'Sent to Microsoft Teams',
        response: await res.text(),
    };
}
