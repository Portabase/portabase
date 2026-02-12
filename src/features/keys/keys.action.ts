import fs from "node:fs";


/**
 * Get Public server key content
 */
export function getPublicServerKeyContent() {
    try {
        return fs.readFileSync("private/keys/server_public.pem", "utf8");
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
export function getMasterServerKeyContent() {
    try {
        return fs.readFileSync("private/keys/master_key.bin");
    } catch (error: any) {
        console.error("Error :", error);
        return {
            success: false,
            message: `An error occurred while getting master server key`,
        };
    }
}
