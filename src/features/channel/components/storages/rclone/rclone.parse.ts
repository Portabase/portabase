export const BLOCKED_BACKEND_TYPES = [
    "local",
    "alias",
    "crypt",
    "chunker",
    "compress",
    "union",
    "combine",
    "hasher",
    "archive",
    "cache",
    "memory",
    "http",
    "googlephotos",
] as const;

type Section = { name: string; type: string | null };

function parseSections(configText: string): Section[] {
    const sections: Section[] = [];

    for (const raw of configText.split("\n")) {
        const line = raw.trim();

        if (line.startsWith("[") && line.endsWith("]") && line.length > 2) {
            sections.push({name: line.slice(1, -1).trim(), type: null});
            continue;
        }

        const eq = line.indexOf("=");
        if (eq === -1) continue;

        const current = sections[sections.length - 1];
        if (!current || current.type !== null) continue;

        if (line.slice(0, eq).trim().toLowerCase() === "type") {
            current.type = line.slice(eq + 1).trim().toLowerCase();
        }
    }

    return sections;
}

export function parseRemoteNames(configText: string): string[] {
    return parseSections(configText).map((s) => s.name).filter(Boolean);
}

export function findBlockedBackend(configText: string): { remote: string; type: string } | null {
    for (const section of parseSections(configText)) {
        if (section.type && (BLOCKED_BACKEND_TYPES as readonly string[]).includes(section.type)) {
            return {remote: section.name, type: section.type};
        }
    }
    return null;
}
