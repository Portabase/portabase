import { createDecipheriv } from "node:crypto";
import { Readable } from "node:stream";
import { createGunzip, createGzip } from "node:zlib";
import * as tar from "tar-stream";
import { getArchiveEntryMatcher, getFileExtension } from "@/utils/common";
import { logger } from "@/lib/logger";
import { getMasterServerKeyContent } from "@/features/agents/utils/keys.server";

const log = logger.child({ module: "features/database/archive-inspect" });

export type UploadKind = "raw" | "targz" | "wrap" | "encrypted";

export type InspectResult = {
  kind: UploadKind;
  storeExtension: string;
  innerName?: string;
};

export class InvalidUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUploadError";
  }
}

const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;

function isGzip(buffer: Buffer): boolean {
  return (
    buffer.length >= 2 &&
    buffer[0] === GZIP_MAGIC_0 &&
    buffer[1] === GZIP_MAGIC_1
  );
}

const ENCRYPTED_HEADER_PREFIX = Buffer.from('{"version":1,"cipher":"AES-256-GCM"');
const GCM_TAG_BYTES = 16;
const BASE_NONCE_BYTES = 8;

function isEncrypted(buffer: Buffer): boolean {
  return buffer.subarray(0, ENCRYPTED_HEADER_PREFIX.length).equals(ENCRYPTED_HEADER_PREFIX);
}

function decryptFirstChunk(buffer: Buffer, masterKey: Buffer): Buffer {
  const headerEnd = buffer.indexOf(0x0a);
  let baseNonce: unknown;
  try {
    baseNonce = JSON.parse(buffer.subarray(0, headerEnd).toString("utf8")).base_nonce;
  } catch {
    baseNonce = null;
  }
  if (headerEnd < 0 || !Array.isArray(baseNonce) || baseNonce.length !== BASE_NONCE_BYTES) {
    throw new InvalidUploadError("Unsupported encrypted backup format.");
  }

  const lengthOffset = headerEnd + 1;
  const chunkStart = lengthOffset + 4;
  const chunkLength = buffer.length >= chunkStart ? buffer.readUInt32BE(lengthOffset) : 0;
  const chunk = buffer.subarray(chunkStart, chunkStart + chunkLength);
  if (chunkLength <= GCM_TAG_BYTES || chunk.length !== chunkLength) {
    throw new InvalidUploadError("Encrypted backup is empty or truncated.");
  }

  const nonce = Buffer.concat([Buffer.from(baseNonce), Buffer.alloc(4)]);
  const decipher = createDecipheriv("aes-256-gcm", masterKey, nonce);
  decipher.setAuthTag(chunk.subarray(chunk.length - GCM_TAG_BYTES));
  try {
    return Buffer.concat([decipher.update(chunk.subarray(0, chunk.length - GCM_TAG_BYTES)), decipher.final()]);
  } catch {
    throw new InvalidUploadError("Encrypted backup is corrupted or was encrypted with another instance's master key.");
  }
}

function listTarEntries(buffer: Buffer): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    const names: string[] = [];
    const extract = tar.extract();

    extract.on("entry", (header, stream, next) => {
      names.push(header.name);
      stream.on("end", next);
      stream.on("error", reject);
      stream.resume();
    });
    extract.on("finish", () => resolve(names));
    extract.on("error", reject);

    Readable.from(buffer)
      .pipe(createGunzip())
      .on("error", reject)
      .pipe(extract);
  });
}

function rawUploadExtension(dbms: string, fileName: string): string {
  if (dbms !== "mssql") return getFileExtension(dbms);
  const match = getArchiveEntryMatcher(dbms).exec(fileName);
  if (!match) {
    throw new InvalidUploadError("MSSQL backup must be a .bacpac, .dacpac or .bak file.");
  }
  return match[0].toLowerCase();
}

export async function inspectUpload(
  buffer: Buffer,
  dbms: string,
  fileName: string,
): Promise<InspectResult> {
  log.info({ dbms, size: buffer.length }, "Inspecting uploaded backup");

  if (isEncrypted(buffer)) {
    const firstChunk = decryptFirstChunk(buffer, await getMasterServerKeyContent());
    if (!isGzip(firstChunk)) {
      throw new InvalidUploadError("Encrypted backup does not contain a tar.gz archive.");
    }
    log.info({ dbms }, "Encrypted tar.gz backup detected, storing as is");
    return { kind: "encrypted", storeExtension: ".tar.gz.enc" };
  }

  if (!isGzip(buffer)) {
    const innerName = `backup${rawUploadExtension(dbms, fileName)}`;
    log.info(
      { dbms, innerName },
      "Native (non-gzip) upload, will wrap into tar.gz before storing",
    );
    return { kind: "wrap", storeExtension: ".tar.gz", innerName };
  }

  let entries: string[];
  try {
    entries = await listTarEntries(buffer);
  } catch (error) {
    log.info(
      { dbms, error: error instanceof Error ? error.message : "unknown" },
      "Gzip is not a tar archive, treating as raw dump",
    );
    return { kind: "raw", storeExtension: getFileExtension(dbms) };
  }

  if (entries.length === 0) {
    log.info({ dbms }, "Tar archive has no entries, treating as raw dump");
    return { kind: "raw", storeExtension: getFileExtension(dbms) };
  }

  const matcher = getArchiveEntryMatcher(dbms);
  const hasValidEntry = entries.some((name) => matcher.test(name));
  if (!hasValidEntry) {
    log.warn(
      { dbms, entries },
      "Tar archive does not contain a valid backup for dbms",
    );
    throw new InvalidUploadError(
      `Archive does not contain a valid ${dbms} backup.`,
    );
  }

  log.info(
    { dbms, entryCount: entries.length },
    "Valid tar.gz backup detected",
  );
  return { kind: "targz", storeExtension: ".tar.gz" };
}

export function packToTarGz(buffer: Buffer, innerName: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const pack = tar.pack();
    const gzip = createGzip();
    const chunks: Buffer[] = [];

    gzip.on("data", (chunk: Buffer) => chunks.push(chunk));
    gzip.on("end", () => resolve(Buffer.concat(chunks)));
    gzip.on("error", reject);
    pack.on("error", reject);

    pack.pipe(gzip);
    pack.entry({ name: innerName }, buffer, (err) => {
      if (err) {
        reject(err);
        return;
      }
      pack.finalize();
    });
  });
}
