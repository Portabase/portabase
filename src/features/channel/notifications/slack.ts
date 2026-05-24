import type {EventPayload, DispatchResult} from '@/features/notifications/notifications.types';

export async function sendSlack(
    config: { slackWebhook: string },
    payload: EventPayload
): Promise<DispatchResult> {
    const {slackWebhook: webhookUrl} = config;

    const text = `*[${payload.level}] ${payload.title}*\n${payload.message}`;
    const blocks = [
        {
            type: 'section',
            text: {type: 'mrkdwn', text: `*[${payload.level.toUpperCase()}] ${payload.title}*`},
        },
        {type: 'section', text: {type: 'mrkdwn', text: payload.message}},
        payload.data
            ? {
                type: 'context',
                elements: [{type: 'mrkdwn', text: `*Data:* \`\`\`${JSON.stringify(payload.data, null, 2)}\`\`\``}],
            }
            : null,
    ].filter(Boolean);

    const body = {
        text,
        blocks,
    };

    const res = await fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Slack error: ${res.status} ${err}`);
    }

    return {
        success: true,
        provider: 'slack',
        message: 'Sent to Slack',
        response: await res.text(),
    };
}