import type {EventPayload, DispatchResult} from '../types';

export async function sendNtfy(
    config: { ntfyServerUrl?: string; ntfyTopic: string; ntfyToken?: string, ntfyUsername?: string, ntfyPassword?: string },
    payload: EventPayload
): Promise<DispatchResult> {
    const {ntfyServerUrl, ntfyTopic, ntfyToken, ntfyUsername, ntfyPassword} = config;

    const baseUrl = (ntfyServerUrl || "https://ntfy.sh").replace(/\/$/, "");

    const body = {
        topic: ntfyTopic,
        title: payload.title,
        message: payload.message + (payload.data ? `\n\nData:\n${JSON.stringify(payload.data, null, 2)}` : ''),
        priority: 1,
        tags: [payload.level === 'critical' ? 'rotating_light' : payload.level === 'warning' ? 'warning' : 'information_source'],
    };

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (ntfyToken) {
        headers['Authorization'] = `Bearer ${ntfyToken}`;
    }

    if (ntfyUsername && ntfyPassword) {
        const credentials = btoa(`${ntfyUsername}:${ntfyPassword}`);
        headers['Authorization'] = `Basic ${credentials}`;
    }

    const res = await fetch(`${baseUrl}`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: headers,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`ntfy error: ${res.status} ${err}`);
    }

    return {
        success: true,
        provider: 'ntfy',
        message: 'Sent to ntfy',
        response: await res.json(),
    };
}
