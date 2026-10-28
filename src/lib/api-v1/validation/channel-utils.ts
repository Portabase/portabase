export function firstDuplicate(ids: string[]): string | null {
    const seen = new Set<string>();
    for (const id of ids) {
        if (seen.has(id)) return id;
        seen.add(id);
    }
    return null;
}

export function redactSecrets(message: string, config: unknown): string {
    const secrets: string[] = [];
    const walk = (value: unknown) => {
        if (typeof value === "string") {
            if (value.length >= 4) secrets.push(value);
        } else if (value && typeof value === "object") {
            Object.values(value).forEach(walk);
        }
    };
    walk(config);
    return secrets
        .sort((a, b) => b.length - a.length)
        .reduce((text, secret) => text.split(secret).join("***"), message);
}
