"use server"
import fs from "node:fs";
import {env} from "@/env.mjs";
import path from "path";
import { userAction } from "@/lib/safe-actions/actions";
import { withAuditEvent } from "@/lib/audit/with-audit-event";
import { ServerActionResult } from "@/types/action-type";


/**
 * Get Public server key content
 */
export async function getPublicServerKeyContent() {
    try {
        const keyPath = path.join(env.PRIVATE_PATH!, '/keys/server_public.pem')
        return fs.readFileSync(keyPath, "utf8");
    } catch (error: any) {
        console.error("Error :", error);
        return {
            success: false,
            message: `An error occurred while getting public server key`,
        };
    }
}


/**
 * Get Master server key
 */
export async function getMasterServerKeyContent() {
    try {
        const keyPath = path.join(env.PRIVATE_PATH!, '/keys/master_key.bin')
        return fs.readFileSync(keyPath);
    } catch (error: any) {
        console.error("Error :", error);
        return {
            success: false,
            message: `An error occurred while getting master server key`,
        };
    }
}


export const downloadMasterKeyAction = userAction.action(async ({ ctx }): Promise<ServerActionResult<string>> => {
    return await withAuditEvent(
        async (): Promise<ServerActionResult<string>> => {
            try {
                const keyPath = path.join(env.PRIVATE_PATH!, "keys/master_key.bin");
                const fileBuffer = fs.readFileSync(keyPath);

                return {
                    success: true,
                    value: fileBuffer.toString("base64"),
                    actionSuccess: {
                        message: "master_key_downloaded",
                    },
                };
            } catch (error) {
                return {
                    success: false,
                    actionError: {
                        message: "Unable to download master key",
                        cause: error instanceof Error ? error.message : "Unknown error",
                    },
                };
            }
        },
        {
            eventType: "settings.encryption_key_download",
            actor: {
                type: "user" as const,
                id: ctx.user.id,
                name: ctx.user.email,
            },
            organization: null,
            target: {
                type: "encryption_key" as const,
                id: null,
                name: "master_key.bin",
            },
            metadata: {},
        },
    );
});
