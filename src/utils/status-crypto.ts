import crypto from "node:crypto";

/**
 * Minimum agent version (its own CARGO_PKG_VERSION) that understands the
 * encrypted storages envelope. Older agents receive legacy plaintext.
 */
export const MIN_AGENT_VERSION_STORAGE_ENC = "1.17.0";

/**
 * Encrypt the storages payload with AES-256-GCM using the raw 32-byte master
 * key. Wire layout: base64( iv(12) ‖ ciphertext ‖ authTag(16) ).
 */
export function encryptStorages(storages: unknown, masterKey: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);
  const plaintext = Buffer.from(JSON.stringify(storages), "utf-8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, tag]).toString("base64");
}

/**
 * Numeric major.minor.patch comparison. Returns false when either version is
 * missing or cannot be parsed as three non-negative integers (fail safe).
 */
export function isAgentVersionAtLeast(
  reported: string | undefined,
  min: string,
): boolean {
  const parse = (v: string): [number, number, number] | null => {
    const core = v.trim().split(/[-+]/)[0];
    const parts = core.split(".");
    if (parts.length !== 3) return null;
    if (!parts.every((p) => /^\d+$/.test(p))) return null;
    const nums = parts.map((p) => Number(p));
    if (nums.some((n) => !Number.isInteger(n) || n < 0)) return null;
    return [nums[0], nums[1], nums[2]];
  };

  if (!reported) return false;
  const a = parse(reported);
  const b = parse(min);
  if (!a || !b) return false;

  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return true;
}
