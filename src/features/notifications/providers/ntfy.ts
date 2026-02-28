import type {EventPayload, DispatchResult} from '../types';

const getPriority = (level?: string): number => {
    switch (level) {
        case 'critical': return 5;
        case 'error': return 4;
        case 'warning': return 3;
        case 'info':
        default: return 2;
    }
};

const formatData = (data: any): string => {
    if (!data || typeof data !== 'object') return '';
    return '\n\nDetails:\n' + Object.entries(data)
        .map(([key, value]) => {
            const stringVal = value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value);
            return `- ${key}: ${stringVal}`;
        })
        .join('\n');
};

const getTags = (level?: string): string[] => {
    const baseTags = ['floppy_disk'];
    
    if (level === 'critical') baseTags.push('rotating_light');
    else if (level === 'error') baseTags.push('x');
    else if (level === 'warning') baseTags.push('warning');
    else baseTags.push('information_source');

    return baseTags;
};

export async function sendNtfy(
    config: { ntfyServerUrl?: string; ntfyTopic: string; ntfyToken?: string, ntfyUsername?: string, ntfyPassword?: string },
    payload: EventPayload
): Promise<DispatchResult> {
    const {ntfyServerUrl, ntfyTopic, ntfyToken, ntfyUsername, ntfyPassword} = config;

    const baseUrl = (ntfyServerUrl || "https://ntfy.sh").replace(/\/$/, "");

    const body = {
        topic: ntfyTopic,
        title: payload.title,
        message: payload.message + formatData(payload.data),
        priority: getPriority(payload.level),
        tags: getTags(payload.level),
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
