import {spawn} from "node:child_process";

export function obscurePassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn("rclone", ["obscure", password], {
            stdio: ["ignore", "pipe", "pipe"],
        });
        let out = "";
        let err = "";
        child.stdout!.on("data", (c: Buffer) => (out += c.toString()));
        child.stderr!.on("data", (c: Buffer) => (err += c.toString()));
        child.on("error", reject);
        child.on("close", (code) =>
            code === 0 ? resolve(out.trim()) : reject(new Error(err.trim() || `rclone obscure exited ${code}`)),
        );
    });
}

export type RcloneFields = Record<string, string | number | undefined | null>;

/**
 * Serialize a field map into an rclone config section ("json to rclone config").
 * Empty/undefined/null values are skipped; values (and keys) containing line
 * breaks are rejected to prevent config injection. Insertion order is preserved.
 */
export function buildRcloneConfigText(remoteName: string, fields: RcloneFields): string {
    if (/[\r\n]/.test(remoteName)) {
        throw new Error("rclone remote name must not contain line breaks");
    }
    const lines = [`[${remoteName}]`];
    for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || value === null) continue;
        const str = String(value).trim();
        if (!str) continue;
        if (/[\r\n]/.test(key) || /[\r\n]/.test(str)) {
            throw new Error(`rclone config value for "${key}" must not contain line breaks`);
        }
        lines.push(`${key} = ${str}`);
    }
    return lines.join("\n") + "\n";
}
