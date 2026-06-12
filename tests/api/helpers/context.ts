import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type ApiTestContext = {
  baseUrl: string;
  authCookie: string;
  apiKey: string;
  userEmail: string;
  agentId: string | null;
  databaseId: string | null;
  backupId: string | null;
  backupStorageId: string | null;
};

export const CONTEXT_PATH = fileURLToPath(
  new URL("../.runtime-context.json", import.meta.url),
);

export function writeContext(context: ApiTestContext) {
  writeFileSync(CONTEXT_PATH, JSON.stringify(context, null, 2), "utf8");
}

export function readContext(): ApiTestContext {
  if (!existsSync(CONTEXT_PATH)) {
    throw new Error(`Missing API test context at ${CONTEXT_PATH}`);
  }

  return JSON.parse(readFileSync(CONTEXT_PATH, "utf8")) as ApiTestContext;
}
