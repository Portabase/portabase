import { createHmac, randomBytes } from 'crypto';
import type { EventPayload, DispatchResult } from '../types';

type NextcloudConfig = {
    nextcloudUrl: string;
    nextcloudBotToken: string;
    nextcloudBotSecret: string;
};

export async function sendNextcloud(
    config: NextcloudConfig,
    payload: EventPayload
): Promise<DispatchResult> {
    const { nextcloudUrl, nextcloudBotToken, nextcloudBotSecret } = config;

    const message = `[${payload.level.toUpperCase()}] ${payload.title}\n\n${payload.message}`;
    const random = randomBytes(32).toString('hex');
    const signature = createHmac('sha256', nextcloudBotSecret)
        .update(random + message)
        .digest('hex');

    const baseUrl = nextcloudUrl.replace(/\/$/, '');
    const res = await fetch(
        `${baseUrl}/ocs/v2.php/apps/spreed/api/v1/bot/${nextcloudBotToken}/message`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'OCS-APIRequest': 'true',
                'X-Nextcloud-Talk-Bot-Random': random,
                'X-Nextcloud-Talk-Bot-Signature': signature,
            },
            body: JSON.stringify({ message }),
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Nextcloud error: ${res.status} ${err}`);
    }

    return {
        success: true,
        provider: 'nextcloud',
        message: 'Sent to Nextcloud Talk',
        response: await res.text(),
    };
}
