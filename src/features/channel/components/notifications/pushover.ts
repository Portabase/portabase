import type {EventPayload, DispatchResult} from '@/features/notifications/types';

export async function sendPushover(
    config: {
        pushoverUserKey: string;
        pushoverApiToken: string;
        pushoverPriority: string;
        pushoverDevice?: string;
    },
    payload: EventPayload
): Promise<DispatchResult> {
    const {pushoverUserKey, pushoverApiToken, pushoverDevice} = config;
    const priority = parseInt(config.pushoverPriority ?? "0", 10);

    const rawTitle = `[${payload.level.toUpperCase()}] ${payload.title}`;
    const rawMessage = payload.data
        ? `${payload.message}\n\nData:\n${JSON.stringify(payload.data)}`
        : payload.message;

    const body: Record<string, string | number> = {
        token: pushoverApiToken,
        user: pushoverUserKey,
        title: rawTitle.length > 250 ? rawTitle.slice(0, 249) + "…" : rawTitle,
        message: rawMessage.length > 1024 ? rawMessage.slice(0, 1023) + "…" : rawMessage,
        priority,
    };

    if (pushoverDevice) {
        body.device = pushoverDevice;
    }

    // Emergency priority requires retry + expire
    if (priority === 2) {
        body.retry = 60;
        body.expire = 3600;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let res: Response;
    try {
        res = await fetch("https://api.pushover.net/1/messages.json", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }

    const json = await res.json().catch(() => null);

    if (!res.ok) {
        const errors = json?.errors?.join(", ") ?? res.statusText;
        throw new Error(`Pushover error ${res.status}: ${errors}`);
    }

    return {
        success: true,
        provider: "pushover",
        message: "Sent via Pushover",
        response: json,
    };
}
