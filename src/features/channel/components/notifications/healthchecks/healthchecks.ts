import type { EventPayload, DispatchResult } from '@/features/notifications/types';

type HealthchecksConfig = {
    baseUrl?: string;
    pingKey: string;
    slug?: string;
    useDatabaseNameAsSlug?: boolean;
    autoCreate?: boolean;
};

const DEFAULT_BASE_URL = "https://hc-ping.com";

export function slugifyDatabaseName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "");
}

function suffixForEvent(event: EventPayload["event"]): string | null {
    if (!event) return null;
    if (event.startsWith("error_")) return "fail";
    if (event.startsWith("success_")) return null;
    return "log";
}

const STATUS_HINTS: Record<number, string> = {
    400: "invalid ping URL",
    404: "check or project not found, verify the ping key and slug",
    409: "ambiguous slug, more than one check matches",
    429: "rate limited, healthchecks.io allows at most 5 pings per minute",
};

export function buildPingUrl(config: HealthchecksConfig, payload: EventPayload): string {
    const base = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");

    const pingKey = config.pingKey?.trim();
    if (!pingKey) {
        throw new Error("Healthchecks error: ping key is required");
    }

    let slug: string | null = null;

    if (config.useDatabaseNameAsSlug) {
        const databaseName = payload.data?.databaseName;
        if (typeof databaseName !== "string" || !databaseName.trim()) {
            throw new Error(
                "Healthchecks error: channel derives the slug from the database name, but this event carries none",
            );
        }
        slug = slugifyDatabaseName(databaseName);
        if (!slug) {
            throw new Error(
                `Healthchecks error: database name "${databaseName}" does not produce a usable slug`,
            );
        }
    } else if (config.slug?.trim()) {
        slug = config.slug.trim();
    }

    const segments = [encodeURIComponent(pingKey)];
    if (slug) segments.push(encodeURIComponent(slug));

    const suffix = suffixForEvent(payload.event);
    if (suffix) segments.push(suffix);

    // create=1 auto-provisions slug-based checks only, it is meaningless on the UUID form.
    const query = config.autoCreate && slug ? "?create=1" : "";

    return `${base}/${segments.join("/")}${query}`;
}

export async function sendHealthchecks(
    config: HealthchecksConfig,
    payload: EventPayload,
): Promise<DispatchResult> {
    const url = buildPingUrl(config, payload);

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "User-Agent": "Portabase-Notifier/1.0",
        },
        body: `${payload.title}\n\n${payload.message}`,
    });

    const text = await res.text();

    if (!res.ok) {
        const hint = STATUS_HINTS[res.status];
        throw new Error(`Healthchecks error: ${res.status}${hint ? ` (${hint})` : ""} ${text}`);
    }

    return {
        success: true,
        provider: "healthchecks",
        message: res.status === 201 ? "Check created and pinged" : "Pinged healthchecks.io",
        response: text || null,
    };
}
