import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import * as tar from "tar-stream";
import { getArchiveEntryMatcher, getFileExtension } from "@/utils/common";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "features/database/archive-inspect" });

export type UploadKind = "raw" | "targz";

export type InspectResult = {
  kind: UploadKind;
  storeExtension: string;
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

export async function inspectUpload(
  buffer: Buffer,
  dbms: string,
): Promise<InspectResult> {
  log.info({ dbms, size: buffer.length }, "Inspecting uploaded backup");

  if (!isGzip(buffer)) {
    log.info({ dbms }, "Upload is not gzip, treating as raw dump");
    return { kind: "raw", storeExtension: getFileExtension(dbms) };
  }

  let entries: string[];
  try {
    entries = await listTarEntries(buffer);
  } catch (error) {
    // Gzip but not a tar → fall back to raw (unchanged behavior).
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
