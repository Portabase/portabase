import { createHmac, randomBytes } from "crypto";
import type { EventPayload, DispatchResult } from '@/features/notifications/notifications.types';

type NextcloudConfig = {
    nextcloudUrl: string;
    nextcloudBotToken: string;
    nextcloudBotSecret: string;
};

function formatPayloadData(data: unknown): string {
    if (!data) {
        return "";
    }

    if (typeof data === "string") {
        return data;
    }

    try {
        return JSON.stringify(data, null, 2);
    } catch {
        return String(data);
    }
}

export async function sendNextcloud(
    config: NextcloudConfig,
    payload: EventPayload
): Promise<DispatchResult> {
    const {
        nextcloudUrl,
        nextcloudBotToken,
        nextcloudBotSecret,
    } = config;

    const payloadData = formatPayloadData(payload.data);

    const messageParts = [
        `[${payload.level.toUpperCase()}] ${payload.title}`,
        payload.message,
    ];

    if (payloadData) {
        messageParts.push(`Payload:\n${payloadData}`);
    }

    const message = messageParts.join("\n\n");

    const random = randomBytes(32).toString("hex");

    const signature = createHmac("sha256", nextcloudBotSecret)
        .update(random + message)
        .digest("hex");

    const baseUrl = nextcloudUrl.replace(/\/$/, "");

    const res = await fetch(
        `${baseUrl}/ocs/v2.php/apps/spreed/api/v1/bot/${nextcloudBotToken}/message`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "OCS-APIRequest": "true",
                "X-Nextcloud-Talk-Bot-Random": random,
                "X-Nextcloud-Talk-Bot-Signature": signature,
            },
            body: JSON.stringify({
                message,
            }),
        }
    );

    if (!res.ok) {
        const err = await res.text();

        throw new Error(
            `Nextcloud error: ${res.status} ${err}`
        );
    }

    return {
        success: true,
        provider: "nextcloud",
        message: "Sent to Nextcloud Talk",
        response: await res.text(),
    };
}