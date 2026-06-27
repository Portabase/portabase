"use server"
import fs from "node:fs";
import {env} from "@/env.mjs";
import path from "path";


/**
 * Get Public server key content
 */
export async function getPublicServerKeyContent() {
    try {
        const keyPath = path.join(env.PRIVATE_PATH, '/keys/server_public.pem')
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
        const keyPath = path.join(env.PRIVATE_PATH, '/keys/master_key.bin')
        return fs.readFileSync(keyPath);
    } catch (error: any) {
        console.error("Error :", error);
        return {
            success: false,
            message: `An error occurred while getting master server key`,
        };
    }
}


export async function downloadMasterKeyAction() {
    try {
        const keyPath = path.join(env.PRIVATE_PATH, "keys/master_key.bin");
        const fileBuffer = fs.readFileSync(keyPath);

        return {
            success: true,
            data: fileBuffer.toString("base64"),
        };
    } catch (error) {
        return {
            success: false,
            message: "Unable to download master key",
        };
    }
}