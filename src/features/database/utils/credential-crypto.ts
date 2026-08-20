import "server-only";
import crypto from "node:crypto";
import {EDbmsSchema} from "@/db/schema/types";
import {DB_SECRET_FIELDS, MASKED_SECRET} from "./credential-fields";

const VERSION = 1 as const;
const KID = "credentials-v1" as const;

export type EncryptedSecret = {
    __encrypted: true;
    version: number;
    kid: string;
    iv: string;
    ciphertext: string;
    tag: string;
};

export function isEncryptedSecret(v: unknown): v is EncryptedSecret {
    if (typeof v !== "object" || v === null) return false;
    const o = v as Record<string, unknown>;
    return (
        o.__encrypted === true &&
        typeof o.iv === "string" &&
        typeof o.ciphertext === "string" &&
        typeof o.tag === "string"
    );
}

export function encryptSecret(plaintext: string, masterKey: Buffer): EncryptedSecret {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        __encrypted: true,
        version: VERSION,
        kid: KID,
        iv: iv.toString("base64"),
        ciphertext: ciphertext.toString("base64"),
        tag: tag.toString("base64"),
    };
}

export function decryptSecret(env: EncryptedSecret, masterKey: Buffer): string {
    if (env.kid !== KID) {
        throw new Error(`Unknown credential key id: ${env.kid}`);
    }
    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        masterKey,
        Buffer.from(env.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(env.tag, "base64"));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(env.ciphertext, "base64")),
        decipher.final(),
    ]);
    return plaintext.toString("utf8");
}

type Config = Record<string, unknown> | null | undefined;

export function encryptConfigSecrets(
    dbms: EDbmsSchema,
    nextConfig: Config,
    prevConfig: Config,
    masterKey: Buffer,
): Config {
    if (!nextConfig) return nextConfig;
    const secretFields = DB_SECRET_FIELDS[dbms] ?? [];
    if (secretFields.length === 0) return nextConfig;

    const out: Record<string, unknown> = {...nextConfig};
    for (const field of secretFields) {
        const value = out[field];

        if (value === MASKED_SECRET) {
            const prev = prevConfig?.[field];
            if (prev === undefined) delete out[field];
            else out[field] = prev;
            continue;
        }
        if (isEncryptedSecret(value)) continue;
        if (typeof value === "string" && value.length > 0) {
            out[field] = encryptSecret(value, masterKey);
        }
    }
    return out;
}

export function decryptConfigSecretsInPlace(
    config: Record<string, unknown>,
    masterKey: Buffer,
): void {
    for (const key of Object.keys(config)) {
        const value = config[key];
        if (isEncryptedSecret(value)) {
            config[key] = decryptSecret(value, masterKey);
        }
    }
}
