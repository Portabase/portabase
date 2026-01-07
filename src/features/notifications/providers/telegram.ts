import type {EventPayload, DispatchResult} from '../types';

export async function sendTelegram(
    config: { telegramBotToken: string; telegramChatId: string },
    payload: EventPayload
): Promise<DispatchResult> {
    const {telegramBotToken, telegramChatId} = config;

    // Helper to escape HTML characters
    const escapeHtml = (unsafe: string) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const title = escapeHtml(payload.title);
    const message = escapeHtml(payload.message);
    const level = escapeHtml(payload.level.toUpperCase());
    const dataString = payload.data ? escapeHtml(JSON.stringify(payload.data, null, 2).substring(0, 1000)) : '';

    const text = `<b>${title}</b>\n\n${message}\n\nLevel: <code>${level}</code>${payload.data ? `\n\nData:\n<pre>${dataString}</pre>` : ''}`;

    const body = {
        chat_id: telegramChatId,
        text,
        parse_mode: 'HTML',
    };

    const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Telegram error: ${res.status} ${err}`);
    }

    return {
        success: true,
        provider: 'telegram',
        message: 'Sent to Telegram',
        response: await res.text(),
    };
}
