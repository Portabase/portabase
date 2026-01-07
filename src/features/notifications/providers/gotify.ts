import type {EventPayload, DispatchResult} from '../types';

export async function sendGotify(
    config: { gotifyServerUrl: string; gotifyAppToken: string },
    payload: EventPayload
): Promise<DispatchResult> {
    const {gotifyServerUrl, gotifyAppToken} = config;

    const baseUrl = gotifyServerUrl.replace(/\/$/, "");

    const body = {
        title: `[${payload.level.toUpperCase()}] ${payload.title}`,
        message: `${payload.message}\n\n${payload.data ? `Data:\n${JSON.stringify(payload.data, null, 2)}` : ''}`,
        priority: payload.level === 'critical' ? 8 : payload.level === 'warning' ? 5 : 2,
    };

    const res = await fetch(`${baseUrl}/message?token=${gotifyAppToken}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gotify error: ${res.status} ${err}`);
    }

    return {
        success: true,
        provider: 'gotify',
        message: 'Sent to Gotify',
        response: await res.json(),
    };
}
