import type { EventPayload, DispatchResult } from '@/features/notifications/types';

type AppriseConfig = {
    appriseServerUrl: string;
    appriseConfigKey: string;
    appriseHeaders?: { key: string; value: string }[];
};

const LEVEL_TO_TYPE: Record<EventPayload["level"], string> = {
    critical: "failure",
    warning: "warning",
    info: "info",
};

export async function sendApprise(
    config: AppriseConfig,
    payload: EventPayload
): Promise<DispatchResult> {
    const { appriseServerUrl, appriseConfigKey, appriseHeaders } = config;

    const baseUrl = appriseServerUrl.replace(/\/$/, "");
    const key = appriseConfigKey.trim();
    const endpoint = `${baseUrl}/notify/${key}`;

    const title = `[${payload.level.toUpperCase()}] ${payload.title}`;
    const body = payload.data
        ? `${payload.message}\n\nData:\n${JSON.stringify(payload.data, null, 2)}`
        : payload.message;

    const requestBody: Record<string, string> = {
        body,
        title,
        type: LEVEL_TO_TYPE[payload.level] ?? "info",
        format: "text",
    };

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Portabase-Notifier/1.0",
    };
    if (appriseHeaders && appriseHeaders.length > 0) {
        const RESERVED = new Set(["content-type", "user-agent"]);
        for (const { key: hKey, value } of appriseHeaders) {
            if (hKey && !RESERVED.has(hKey.toLowerCase())) headers[hKey] = value;
        }
    }

    const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
    });

    const text = await res.text();

    if (!res.ok) {
        throw new Error(`Apprise error: ${res.status} ${text}`);
    }

    return {
        success: true,
        provider: "apprise",
        message: "Sent to Apprise",
        response: text || null,
    };
}
