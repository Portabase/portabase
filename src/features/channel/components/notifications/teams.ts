import type { EventPayload, DispatchResult } from '@/features/notifications/types';



export async function sendTeams(
    config: { teamsWebhook: string },
    payload: EventPayload
): Promise<DispatchResult> {
    const { teamsWebhook: webhookUrl } = config;
    const levelColor: Record<string, string> = {
        critical: 'attention',
        warning: 'warning',
        info: 'good',
    };
    const accentColor = levelColor[payload.level] ?? 'default';
    const bodyItems: object[] = [
        {
            type: 'TextBlock',
            text: `**[${payload.level.toUpperCase()}] ${payload.title}**`,
            wrap: true,
            color: accentColor,
            size: 'Medium',
            weight: 'Bolder',
        },
        {
            type: 'TextBlock',
            text: payload.message,
            wrap: true,
        },
    ];

    if (payload.data) {
        bodyItems.push(
            {
                type: 'TextBlock',
                text: '**Data:**',
                wrap: true,
                weight: 'Bolder',
            },
            {
                type: 'TextBlock',
                text: JSON.stringify(payload.data, null, 2).substring(0, 1000),
                wrap: true,
                fontType: 'Monospace',
            }
        );
    }

    const adaptiveCard = {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.2',
        body: bodyItems,
    };

    const body = {
        type: 'message',
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                contentUrl: null,
                content: adaptiveCard,
            },
        ],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let res: Response;
    try {
        res = await fetch(webhookUrl, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Teams error: ${res.status} ${err}`);
    }

    return {
        success: true,
        provider: 'teams',
        message: 'Sent to Microsoft Teams',
        response: res.statusText,
    };
} 

