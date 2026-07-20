import type { EventPayload, DispatchResult } from '@/features/notifications/types';

type AppriseConfig = {
    appriseServerUrl: string;
    appriseConfigKey?: string;
    appriseUrls?: string;
    appriseTag?: string;
    appriseFormat?: "text" | "markdown" | "html";
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
    const {
        appriseServerUrl,
        appriseConfigKey,
        appriseUrls,
        appriseTag,
        appriseFormat = "text",
        appriseHeaders,
    } = config;

    const baseUrl = appriseServerUrl.replace(/\/$/, "");
    const key = appriseConfigKey?.trim();
    const endpoint = key ? `${baseUrl}/notify/${key}` : `${baseUrl}/notify`;

    const title = `[${payload.level.toUpperCase()}] ${payload.title}`;
    const body = payload.data
        ? `${payload.message}\n\nData:\n${JSON.stringify(payload.data, null, 2)}`
        : payload.message;

    const requestBody: Record<string, string> = {
        body,
        title,
        type: LEVEL_TO_TYPE[payload.level] ?? "info",
        format: appriseFormat,
    };

    if (appriseTag?.trim()) {
        requestBody.tag = appriseTag.trim();
    }

    // Stateless mode: pass service URLs inline. Apprise accepts newline/comma separated.
    if (!key && appriseUrls?.trim()) {
        requestBody.urls = appriseUrls.trim();
    }

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
