import { createGzip, gzipSync } from "node:zlib";
import * as tar from "tar-stream";
import { describe, expect, it } from "vitest";
import {
  InvalidUploadError,
  inspectUpload,
  packToTarGz,
} from "@/features/database/utils/archive-inspect";
import {
  getArchiveEntryMatcher,
  getFileExtension,
  getFileHeadersBasedOnDbms,
} from "@/utils/common";

function emptyTarGz(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pack = tar.pack();
    const gzip = createGzip();
    const chunks: Buffer[] = [];
    gzip.on("data", (c: Buffer) => chunks.push(c));
    gzip.on("end", () => resolve(Buffer.concat(chunks)));
    gzip.on("error", reject);
    pack.pipe(gzip);
    pack.finalize(); // no entries
  });
}

describe("inspectUpload", () => {
  it("accepts a docker-volume archive whose entries are the volume's own files", async () => {
    const archive = await packToTarGz(Buffer.from('{"k":"v"}'), "data/config.json");
    const result = await inspectUpload(archive, "docker-volume", "vol.tar.gz");
    expect(result.kind).toBe("targz");
  });

  it("rejects a gzip that is not a tar archive for docker-volume", async () => {
    const notTar = gzipSync(Buffer.from("this is not a tar archive at all"));
    await expect(
      inspectUpload(notTar, "docker-volume", "bad.gz"),
    ).rejects.toBeInstanceOf(InvalidUploadError);
  });

  it("rejects an empty tar archive for docker-volume", async () => {
    await expect(
      inspectUpload(await emptyTarGz(), "docker-volume", "empty.tar.gz"),
    ).rejects.toBeInstanceOf(InvalidUploadError);
  });

  it("accepts a files-engine archive (behaves like docker-volume)", async () => {
    const archive = await packToTarGz(Buffer.from("x"), "app/data.bin");
    const result = await inspectUpload(archive, "files", "files.tar.gz");
    expect(result.kind).toBe("targz");
  });

  it("wraps a db2 raw (non-gzip) dump into tar.gz with backup.dump inside", async () => {
    const result = await inspectUpload(
      Buffer.from("fake db2 dump bytes"),
      "db2",
      "TESTDB.dump",
    );
    expect(result.kind).toBe("wrap");
    expect(result.innerName).toBe("backup.dump");
  });
});

describe("BACKUP_FILE_META registry", () => {
  it.each(["docker-volume", "files", "db2", "postgresql-cluster"])(
    "resolves %s without throwing",
    (dbms) => {
      expect(() => getFileHeadersBasedOnDbms(dbms)).not.toThrow();
      expect(() => getArchiveEntryMatcher(dbms)).not.toThrow();
      expect(getFileExtension(dbms)).toBeTruthy();
    },
  );

  it("includes .bak support for mssql", () => {
    const accept = getFileHeadersBasedOnDbms("mssql");
    const hasBak = Object.values(accept).some((exts) => exts.includes(".bak"));
    expect(hasBak).toBe(true);
    expect(getArchiveEntryMatcher("mssql").test("db.bak")).toBe(true);
  });
});
