import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdir, writeFile, rm } from "fs/promises";
import path from "path";
import { checkLocal } from "./local";

const rel = ".tmp-presence-test";

beforeAll(async () => {
  await mkdir(path.join(process.cwd(), rel), { recursive: true });
  await writeFile(path.join(process.cwd(), rel, "exists.txt"), "hi");
});
afterAll(async () => {
  await rm(path.join(process.cwd(), rel), { recursive: true, force: true });
});

describe("checkLocal", () => {
  it("present for an existing file", async () => {
    const r = await checkLocal({ baseDir: rel }, { data: { path: "exists.txt" } });
    expect(r.success).toBe(true);
  });
  it("definitively missing for an absent file (ENOENT)", async () => {
    const r = await checkLocal({ baseDir: rel }, { data: { path: "nope.txt" } });
    expect(r.success).toBe(false);
    expect(r.notFound).toBe(true);
  });
});
