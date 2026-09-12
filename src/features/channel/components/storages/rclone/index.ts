import {spawn} from "node:child_process";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {Readable} from "node:stream";

import {RcloneConfig} from "@/features/channel/components/storages/rclone/types";
import {generateFileUrl} from "@/features/storages/utils/storages.helpers";
import {
    StorageCopyInput,
    StorageDeleteInput,
    StorageGetInput,
    StorageMetaData,
    StorageResult,
    StorageUploadInput,
} from "@/features/storages/types";

const PROVIDER = "rclone" as const;

async function writeConfig(config: RcloneConfig): Promise<{ dir: string; file: string }> {
    const dir = await mkdtemp(path.join(tmpdir(), "portabase-rclone-"));
    try {
        const file = path.join(dir, "rclone.conf");
        await writeFile(file, config.configText, {mode: 0o600});
        return {dir, file};
    } catch (err) {
        await rm(dir, {recursive: true, force: true});
        throw err;
    }
}

/** `<remote>:<remotePath>/<filePath>`, collapsing an empty remotePath. */
function target(config: RcloneConfig, filePath: string): string {
    const base = (config.remotePath ?? "").trim().replace(/^\/+|\/+$/g, "");
    return base
        ? `${config.remoteName}:${base}/${filePath}`
        : `${config.remoteName}:${filePath}`;
}

type RunResult = { code: number; stdout: Buffer; stderr: string };


function run(configFile: string, args: string[], stdin?: Readable): Promise<RunResult> {
    return new Promise((resolve, reject) => {
        const child = spawn("rclone", ["--config", configFile, ...args], {
            stdio: [stdin ? "pipe" : "ignore", "pipe", "pipe"],
        });

        const stdout: Buffer[] = [];
        let stderr = "";

        child.stdout!.on("data", (c: Buffer) => stdout.push(c));
        child.stderr!.on("data", (c: Buffer) => {
            stderr += c.toString();
        });

        child.on("error", reject);
        child.on("close", (code) =>
            resolve({code: code ?? -1, stdout: Buffer.concat(stdout), stderr: stderr.trim()}),
        );

        if (stdin) {
            stdin.pipe(child.stdin!);
            child.stdin!.on("error", () => {});
        }
    });
}


function statFound(stat: RunResult, remotePath: string): boolean {
    if (stat.code !== 0) return false;

    let parsed: unknown;
    try {
        parsed = JSON.parse(stat.stdout.toString());
    } catch {
        return false;
    }

    if (typeof parsed !== "object" || parsed === null) return false;
    const {IsDir, Name} = parsed as { IsDir?: unknown; Name?: unknown };
    const expected = path.basename(remotePath.split(":").pop() ?? remotePath);
    return IsDir === false && Name === expected;
}

async function withConfig(
    config: RcloneConfig,
    fn: (file: string) => Promise<StorageResult>,
): Promise<StorageResult> {
    const {dir, file} = await writeConfig(config);
    try {
        return await fn(file);
    } finally {
        await rm(dir, {recursive: true, force: true});
    }
}

function toReadable(file: StorageUploadInput["file"]): Readable | null {
    if (Buffer.isBuffer(file) || file instanceof Uint8Array) return Readable.from(Buffer.from(file));
    if ((file as Readable)?.pipe) return file as Readable;
    return null;
}

export async function uploadRclone(
    config: RcloneConfig,
    input: { data: StorageUploadInput; metadata?: StorageMetaData },
): Promise<StorageResult> {
    const body = toReadable(input.data.file);
    if (!body) {
        return {success: false, provider: PROVIDER, error: "Unsupported file type for streaming upload"};
    }

    return withConfig(config, async (file) => {
        const {code, stderr} = await run(file, ["rcat", target(config, input.data.path)], body);
        return code === 0
            ? {success: true, provider: PROVIDER}
            : {success: false, provider: PROVIDER, error: stderr || `rclone rcat exited ${code}`};
    });
}

export async function getRclone(
    config: RcloneConfig,
    input: { data: StorageGetInput; metadata: StorageMetaData },
): Promise<StorageResult> {
    const remote = target(config, input.data.path);

    const {dir, file} = await writeConfig(config);

    let stat: RunResult;
    try {
        stat = await run(file, ["lsjson", "--stat", remote]);
    } catch (err) {
        await rm(dir, {recursive: true, force: true});
        throw err;
    }
    if (!statFound(stat, remote)) {
        await rm(dir, {recursive: true, force: true});
        return {success: false, provider: PROVIDER, error: stat.stderr || "File not found"};
    }

    const child = spawn("rclone", ["--config", file, "cat", remote], {
        stdio: ["ignore", "pipe", "pipe"],
    });

    const stdout = child.stdout!;

    let stderr = "";
    child.stderr!.on("data", (c: Buffer) => {
        stderr += c.toString();
    });

    let cleaned = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        void rm(dir, {recursive: true, force: true});
    };

    child.on("close", (code) => {
        if (code !== 0) {
            stdout.destroy(new Error(stderr.trim() || `rclone cat exited ${code}`));
        }
        cleanup();
    });
    child.on("error", (err) => {
        stdout.destroy(err);
        cleanup();
    });
    stdout.on("close", cleanup);

    const url = input.data.signedUrl ? await generateFileUrl(input) : undefined;

    if (input.data.signedUrl && !url) {
        stdout.destroy();
        cleanup();
        return {success: false, provider: PROVIDER, error: "Unable to generate signed URL"};
    }

    return {
        success: true,
        provider: PROVIDER,
        file: stdout as unknown as Buffer | Readable,
        url: url ?? undefined,
    };
}

export async function deleteRclone(
    config: RcloneConfig,
    input: { data: StorageDeleteInput; metadata?: StorageMetaData },
): Promise<StorageResult> {
    return withConfig(config, async (file) => {
        const {code, stderr} = await run(file, ["deletefile", target(config, input.data.path)]);
        return code === 0
            ? {success: true, provider: PROVIDER}
            : {success: false, provider: PROVIDER, error: stderr || `rclone deletefile exited ${code}`};
    });
}

export async function checkRclone(
    config: RcloneConfig,
    input: { data: { path: string }; metadata?: StorageMetaData },
): Promise<StorageResult> {
    return withConfig(config, async (file) => {
        const remote = target(config, input.data.path);
        const stat = await run(file, ["lsjson", "--stat", remote]);

        if (statFound(stat, remote)) {
            return {success: true, provider: PROVIDER};
        }

        return {
            success: false,
            provider: PROVIDER,
            notFound: stat.code === 0,
            error: stat.stderr || "File not found",
        };
    });
}

export async function copyRclone(
    config: RcloneConfig,
    input: { data: StorageCopyInput },
): Promise<StorageResult> {
    return withConfig(config, async (file) => {
        const {code, stderr} = await run(file, [
            "copyto",
            target(config, input.data.from),
            target(config, input.data.to),
        ]);
        return code === 0
            ? {success: true, provider: PROVIDER}
            : {success: false, provider: PROVIDER, error: stderr || `rclone copyto exited ${code}`};
    });
}

export async function pingRclone(config: RcloneConfig): Promise<StorageResult> {
    return withConfig(config, async (file) => {
        const probe = target(config, "backups/portabase-ping.txt");

        const write = await run(file, ["rcat", probe], Readable.from(Buffer.from("ping")));
        if (write.code !== 0) {
            return {success: false, provider: PROVIDER, response: write.stderr || "rclone write failed"};
        }

        const read = await run(file, ["cat", probe]);
        if (read.code !== 0 || read.stdout.toString() !== "ping") {
            await run(file, ["deletefile", probe]);
            return {success: false, provider: PROVIDER, response: read.stderr || "rclone read-back failed"};
        }

        const remove = await run(file, ["deletefile", probe]);
        if (remove.code !== 0) {
            return {success: false, provider: PROVIDER, response: remove.stderr || "rclone delete failed"};
        }

        return {success: true, provider: PROVIDER, response: "rclone OK"};
    });
}
