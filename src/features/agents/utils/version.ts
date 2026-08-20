/**
 * Minimum agent version that supports pushing database config (create / settings).
 */
export const MIN_DATABASE_CONFIG_AGENT_VERSION = "1.19.0";

type Semver = { major: number; minor: number; patch: number };

function parse(version: string): Semver | null {
    const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
    if (!match) return null;
    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
    };
}

export function isVersionAtLeast(
    current: string | null | undefined,
    min: string,
): boolean {
    if (!current) return false;
    const a = parse(current);
    const b = parse(min);
    if (!a || !b) return false;

    if (a.major !== b.major) return a.major > b.major;
    if (a.minor !== b.minor) return a.minor > b.minor;
    return a.patch >= b.patch;
}

export function agentSupportsDatabaseConfig(
    version: string | null | undefined,
): boolean {
    return isVersionAtLeast(version, MIN_DATABASE_CONFIG_AGENT_VERSION);
}
