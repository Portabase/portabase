import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import * as tar from "tar-stream";
import { getArchiveEntryMatcher, getFileExtension } from "@/utils/common";

export type UploadKind = "raw" | "targz";

export type InspectResult = {
  kind: UploadKind;
  /** Extension to use when naming the stored file, incl. leading dot. */
  storeExtension: string;
};

/** Thrown when a real tarball does not hold a valid backup for the dbms. */
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

/**
 * Streams the gzip buffer through a tar parser and returns the entry names.
 * File data is drained without buffering, so memory stays flat regardless of
 * archive size. Rejects if the stream is not a valid gzip-of-tar.
 */
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

/**
 * Determines how an uploaded backup file should be treated.
 *
 * - Not gzip → raw dump, stored with the dbms's normal extension (unchanged
 *   behavior).
 * - Gzip that is a valid tar → must contain an entry matching the dbms;
 *   otherwise InvalidUploadError. Stored as `.tar.gz`.
 * - Gzip that is NOT a tar (e.g. mongodump `--archive --gzip`) → treated as a
 *   raw upload, preserving today's behavior. No regression.
 */
export async function inspectUpload(
  buffer: Buffer,
  dbms: string,
): Promise<InspectResult> {
  if (!isGzip(buffer)) {
    return { kind: "raw", storeExtension: getFileExtension(dbms) };
  }

  let entries: string[];
  try {
    entries = await listTarEntries(buffer);
  } catch {
    // Gzip but not a tar → fall back to raw (unchanged behavior).
    return { kind: "raw", storeExtension: getFileExtension(dbms) };
  }

  if (entries.length === 0) {
    return { kind: "raw", storeExtension: getFileExtension(dbms) };
  }

  const matcher = getArchiveEntryMatcher(dbms);
  const hasValidEntry = entries.some((name) => matcher.test(name));
  if (!hasValidEntry) {
    throw new InvalidUploadError(
      `Archive does not contain a valid ${dbms} backup.`,
    );
  }

  return { kind: "targz", storeExtension: ".tar.gz" };
}
