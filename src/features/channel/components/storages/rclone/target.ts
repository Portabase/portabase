import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";

import {env} from "@/env.mjs";
import {localStorageRoot} from "@/lib/local-storage/credential";
import type {StorageProviderKind} from "@/features/storages/types";
import type {RcloneConfig} from "@/features/channel/components/storages/rclone/types";
import type {SftpConfig} from "@/features/channel/components/storages/sftp/types";
import type {GoogleCloudStorageConfig} from "@/features/channel/components/storages/google-cloud-storage/types";
import type {GoogleDriveConfig} from "@/features/channel/components/storages/google-drive/types";
import {buildRcloneConfigText, obscurePassword} from "@/features/channel/components/storages/rclone/config";
import {validateRcloneConfig} from "@/features/channel/components/storages/rclone/rclone.parse";

export type RcloneTarget = { rclone: RcloneConfig; cleanup: () => void };

type S3Config = {
    endPointUrl: string;
    accessKey: string;
    secretKey: string;
    bucketName: string;
    region?: string;
    port?: number | string;
    ssl?: boolean;
};

type BlobConfig = {
    authMode?: string;
    accountName?: string;
    accountKey?: string;
    connectionString?: string;
    containerName: string;
    endpointUrl?: string;
};

const noop = () => {};

/**
 * Express a storage channel as an rclone remote. Mirrors the agent's
 * `providers/rclone/target.rs` byte for byte (golden fixtures:
 * agent-rust/src/tests/storage/fixtures/rclone-target/). Except `local`: the agent reaches
 * the dashboard disk through the `/storage/*` servers, never through this mapper.
 */
export async function toRcloneTarget(provider: StorageProviderKind, config: unknown): Promise<RcloneTarget> {
    switch (provider) {
        case "s3":
            return s3(config as S3Config);
        case "blob":
            return blob(config as BlobConfig);
        case "google-cloud-storage":
            return gcs(config as GoogleCloudStorageConfig);
        case "google-drive":
            return drive(config as GoogleDriveConfig);
        case "sftp":
            return sftp(config as SftpConfig);
        case "rclone":
            return userRclone(config as RcloneConfig);
        case "local":
            return local();
        default:
            throw new Error(`unknown storage provider '${provider as string}'`);
    }
}

/**
 * The dashboard's own disk (spec B), for dashboard-side restic/sync operations only.
 * An alias, because `remotePath()` strips a leading `/` from the base path. The agent
 * never maps `local` here: it goes through the `/storage/*` servers.
 */
function local(): RcloneTarget {
    return target("pblocal", {type: "alias", remote: localStorageRoot(env.PRIVATE_PATH!)}, "");
}

/** Mirrors the agent's `validate_config`. */
function userRclone(c: RcloneConfig): RcloneTarget {
    const error = validateRcloneConfig(c.configText, c.remoteName);
    if (error) throw new Error(error);
    return {rclone: {configText: c.configText, remoteName: c.remoteName, remotePath: c.remotePath ?? ""}, cleanup: noop};
}

function target(remoteName: string, fields: Record<string, string | number | undefined | null>, basePath: string): RcloneTarget {
    return {rclone: {configText: buildRcloneConfigText(remoteName, fields), remoteName, remotePath: basePath}, cleanup: noop};
}

function s3(c: S3Config): RcloneTarget {
    const scheme = (c.ssl ?? true) ? "https" : "http";
    const port = c.port === undefined || c.port === null ? "" : String(c.port).trim();
    const endpoint = port ? `${scheme}://${c.endPointUrl}:${port}` : `${scheme}://${c.endPointUrl}`;
    return target("s3", {
        type: "s3",
        provider: "Other",
        access_key_id: c.accessKey,
        secret_access_key: c.secretKey,
        endpoint,
        region: c.region?.trim() || "us-east-1",
        force_path_style: "true",
        no_check_bucket: "true",
    }, c.bucketName);
}

/** Port of the agent's `parse_connection_string`. */
function parseConnectionString(cs: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const pair of cs.split(";")) {
        if (!pair.trim()) continue;
        const idx = pair.indexOf("=");
        if (idx < 0) continue;
        out[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
    return out;
}

/** Port of the agent's `ensure_account_in_endpoint`. */
function ensureAccountInEndpoint(endpoint: string, account: string): string {
    const trimmed = endpoint.replace(/\/+$/, "");
    if (!account) return trimmed;
    try {
        const url = new URL(trimmed);
        if (url.hostname.includes(account)) return trimmed;
        const p = url.pathname.replace(/^\/+|\/+$/g, "");
        if (p === account || p.startsWith(`${account}/`)) return trimmed;
    } catch {
        // not a URL: fall through like the agent
    }
    return `${trimmed}/${account}`;
}

/** Port of the agent's `AzureBlobProviderConfig::resolve`. */
function resolveAzure(c: BlobConfig): { account: string; key: string; endpoint: string } {
    const mode = (c.authMode ?? "").trim();
    const hasCs = !!c.connectionString?.trim();
    if (mode === "connectionString" || (mode === "" && hasCs)) {
        if (!hasCs) throw new Error("authMode is connectionString but connectionString is empty");
        const map = parseConnectionString(c.connectionString!);
        const endpoint = map["BlobEndpoint"];
        if (endpoint === undefined) throw new Error("connection string missing BlobEndpoint");
        return {account: map["AccountName"] ?? c.accountName ?? "", key: map["AccountKey"] ?? c.accountKey ?? "", endpoint};
    }
    if (!c.accountName?.trim()) throw new Error("accountName required for accountKey auth");
    if (!c.accountKey?.trim()) throw new Error("accountKey required for accountKey auth");
    const explicit = c.endpointUrl?.trim();
    const endpoint = explicit ? ensureAccountInEndpoint(explicit, c.accountName) : `https://${c.accountName}.blob.core.windows.net`;
    return {account: c.accountName, key: c.accountKey, endpoint};
}

function blob(c: BlobConfig): RcloneTarget {
    const r = resolveAzure(c);
    if (!r.key.trim()) {
        throw new Error("azure blob needs an account key to be used as an rclone target (SAS-only connection strings are not supported)");
    }
    return target("blob", {
        type: "azureblob",
        account: r.account,
        key: r.key,
        endpoint: r.endpoint,
        // Native uploads never create the container; neither should rclone.
        no_check_container: "true",
    }, c.containerName);
}

function gcs(c: GoogleCloudStorageConfig): RcloneTarget {
    const fields: Record<string, string> = {type: "google cloud storage", project_number: c.projectId};
    const endpoint = c.apiEndpoint?.trim();
    if (endpoint) {
        // A custom endpoint means the fake-gcs emulator, which does not verify credentials.
        // rclone's `endpoint` is the JSON API base path, not the bare host.
        fields.anonymous = "true";
        fields.endpoint = `${endpoint.replace(/\/+$/, "")}/storage/v1/`;
    } else {
        // Keys in alphabetical order: byte-identical to the agent's serde_json output.
        fields.service_account_credentials = JSON.stringify({
            client_email: c.clientEmail,
            private_key: c.privateKey.replace(/\\n/g, "\n"),
            private_key_id: "",
            project_id: c.projectId,
            token_uri: "https://oauth2.googleapis.com/token",
            type: "service_account",
            universe_domain: "googleapis.com",
        });
    }
    // Uniform bucket-level access (the GCS default) rejects rclone's default
    // `predefinedAcl=private`; and native uploads never create the bucket.
    fields.bucket_policy_only = "true";
    fields.no_check_bucket = "true";
    return target("google-cloud-storage", fields, c.bucketName);
}

function drive(c: GoogleDriveConfig): RcloneTarget {
    return target("google-drive", {
        type: "drive",
        client_id: c.clientId,
        client_secret: c.clientSecret,
        scope: "drive.file",
        token: JSON.stringify({access_token: "", expiry: "0001-01-01T00:00:00Z", refresh_token: c.refreshToken, token_type: "Bearer"}),
        root_folder_id: c.folderId,
        // Deletes (retention, restic prune) must free space, not fill the Drive trash.
        use_trash: "false",
    }, "");
}

async function sftp(config: SftpConfig): Promise<RcloneTarget> {
    // Moved verbatim from sftp/index.ts `toRcloneConfig`.
    let keyDir: string | null = null;
    let keyFile: string | undefined;
    let pass: string | undefined;

    try {
        if (config.privateKey && config.privateKey.trim()) {
            keyDir = await mkdtemp(path.join(tmpdir(), "portabase-sftp-"));
            keyFile = path.join(keyDir, "id_key");
            await writeFile(keyFile, config.privateKey, {mode: 0o600});
        }

        if (config.password && config.password.trim()) {
            pass = await obscurePassword(config.password);
        }
    } catch (e) {
        if (keyDir) await rm(keyDir, {recursive: true, force: true});
        throw e;
    }

    const cleanup = () => {
        if (keyDir) void rm(keyDir, {recursive: true, force: true});
    };

    return {
        rclone: {
            configText: buildRcloneConfigText("sftp", {
                type: "sftp",
                host: config.host,
                port: config.port,
                user: config.username,
                key_file: keyFile,
                pass,
                host_keys: config.hostKeys,
            }),
            remoteName: "sftp",
            remotePath: config.remotePath ?? "",
        },
        cleanup,
    };
}
