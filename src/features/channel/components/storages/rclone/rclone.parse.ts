/** Entries must not contain spaces: the type is compared with its spaces removed (rclone resolves a
 * backend by name, registered prefix, or name without spaces: `google photos` = `googlephotos`). */
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
    "gphotos",
] as const;

const NAME_RE = /^[A-Za-z0-9_][A-Za-z0-9_.+@-]*$/;
const KEY_RE = /^[A-Za-z0-9_]+$/;
const TYPE_RE = /^[a-z0-9 ]+$/;
const FORBIDDEN_KEYS = new Set([
    "ssh", "env_auth", "use_msi", "use_az", "use_kerberos", "kerberos_ccache", "key_use_agent", "set_env", "unix_socket",
]);

// Whitespace as the agent's Rust `trim` and rclone's Go `TrimSpace` see it. JS `trim()` differs
// (it strips U+FEFF but not U+0085), so `type = local<U+0085>` would slip past it.
const SPACE = /[\t-\r \u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/;

function trim(s: string): string {
    let start = 0;
    let end = s.length;
    while (start < end && SPACE.test(s[start])) start++;
    while (end > start && SPACE.test(s[end - 1])) end--;
    return s.slice(start, end);
}

// ASCII only, like Rust's `to_ascii_lowercase` on the agent side.
const lower = (s: string) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());

function isForbiddenKey(key: string): boolean {
    const k = lower(key);
    return FORBIDDEN_KEYS.has(k) || k.endsWith("_command") || k.endsWith("_file") || k.endsWith("_path");
}

/** Remote names for the form hint; `validateRcloneConfig` is the actual gate. */
export function parseRemoteNames(configText: string): string[] {
    return configText
        .split("\n")
        .map(trim)
        .filter((line) => line.startsWith("[") && line.endsWith("]"))
        .map((line) => trim(line.slice(1, -1)))
        .filter(Boolean);
}

/**
 * Strict check for user-pasted rclone configs (never for configs Portabase builds itself, e.g. sftp's
 * `key_file`). Exactly one `[remote]` of plain `key = value` lines: rclone and a naive parser must
 * read it identically, and nothing may run a local command or read host credentials.
 * Mirrors `validate_config` in the agent (same rules, same order, same messages). Returns the error or null.
 */
export function validateRcloneConfig(configText: string, remoteName: string): string | null {
    const names: string[] = [];
    const pairs: { key: string; value: string }[] = [];
    let beforeHeader: number | null = null;

    const lines = configText.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const n = i + 1;
        const line = trim(lines[i]);
        if (!line || line.startsWith("#") || line.startsWith(";")) continue;

        const eq = line.indexOf("=");
        if (line.startsWith("[") && line.endsWith("]")) {
            names.push(trim(line.slice(1, -1)));
        } else if (eq > 0) {
            if (names.length === 0 && beforeHeader === null) beforeHeader = n;
            pairs.push({key: trim(line.slice(0, eq)), value: trim(line.slice(eq + 1))});
        } else {
            return `rclone config line ${n} is not a [section] header or a 'key = value' pair`;
        }
    }

    if (beforeHeader !== null) return `rclone config line ${beforeHeader} appears before any [section]`;
    if (names.length !== 1) return `rclone config must contain exactly one [section] (found ${names.length})`;

    const name = names[0];
    if (!NAME_RE.test(name)) return `invalid rclone remote name '${name}'`;

    for (const {key} of pairs) {
        if (!KEY_RE.test(key)) return `invalid rclone config key '${key}' (remote '${name}')`;
    }
    // rclone (goconfig) unquotes `value` and `"""value"""` and drops what follows the closing quote.
    for (const {key, value} of pairs) {
        if (value.startsWith("`") || value.startsWith('"""')) {
            return `rclone config value for key '${key}' must not be quoted (remote '${name}')`;
        }
    }
    const seen = new Set<string>();
    for (const {key} of pairs) {
        if (seen.has(lower(key))) return `duplicate rclone config key '${key}' (remote '${name}')`;
        seen.add(lower(key));
    }
    for (const {key} of pairs) {
        if (isForbiddenKey(key)) return `rclone config key '${key}' is not allowed (remote '${name}')`;
    }

    const typeEntry = pairs.find(({key}) => lower(key) === "type");
    if (!typeEntry) return `rclone remote '${name}' has no type`;
    const type = lower(typeEntry.value);
    if (!TYPE_RE.test(type)) return `invalid rclone backend type '${type}' (remote '${name}')`;
    const compact = type.replace(/ /g, "");
    if ((BLOCKED_BACKEND_TYPES as readonly string[]).includes(compact)) {
        return `rclone backend type '${type}' is not allowed (remote '${name}')`;
    }
    // The other OCI providers read the host's OCI config or instance identity. Exact match on
    // purpose: rclone (checked up to 1.76.0) compares the key and the value case-sensitively, and falls back to
    // host credentials for `PROVIDER = no_auth` (key ignored) and `provider = NO_AUTH` (unknown value).
    if (compact === "oracleobjectstorage") {
        if (!pairs.some(({key, value}) => key === "provider" && value === "no_auth")) {
            return `rclone oracleobjectstorage remotes must use provider = no_auth (remote '${name}')`;
        }
    }
    if (remoteName !== name) {
        return `remote '${remoteName}' is not defined in the rclone config (available: ${name})`;
    }

    return null;
}
