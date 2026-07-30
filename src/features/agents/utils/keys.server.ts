import "server-only";
import fs from "node:fs";
import {env} from "@/env.mjs";
import path from "path";

export async function getPublicServerKeyContent(): Promise<string> {
    const keyPath = path.join(env.PRIVATE_PATH, '/keys/server_public.pem');
    return fs.readFileSync(keyPath, "utf8");
}

export async function getMasterServerKeyContent(): Promise<Buffer> {
    const keyPath = path.join(env.PRIVATE_PATH, '/keys/master_key.bin');
    return fs.readFileSync(keyPath);
}
