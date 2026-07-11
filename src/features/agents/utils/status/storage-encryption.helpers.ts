import {logger} from "@/lib/logger";
import {encryptStorages, isAgentVersionAtLeast, MIN_AGENT_VERSION_STORAGE_ENC} from "@/utils/status-crypto";

const log = logger.child({module: "api/agent/status/storage-encryption"});

export function applyStorageEncryption(
    entry: Record<string, any>,
    version: string | undefined,
    masterKey: Buffer | null,
    agentId: string,
): void {
    if (!masterKey) return;
    if (!Array.isArray(entry.storages) || entry.storages.length === 0) return;
    if (!isAgentVersionAtLeast(version, MIN_AGENT_VERSION_STORAGE_ENC)) {
        console.log(
            `============================================================\n` +
            `⚠️OUTDATED AGENT — STORAGE CREDENTIALS SENT UNENCRYPTED\n` +
            `Agent ${agentId} reports v${version ?? "unknown"} (< required v${MIN_AGENT_VERSION_STORAGE_ENC}).\n` +
            `Update this agent to v${MIN_AGENT_VERSION_STORAGE_ENC}+ to encrypt storage credentials in transit.\n` +
            `============================================================`
        )
        return;
    }

    try {
        const ciphertext = encryptStorages(entry.storages, masterKey);
        entry.storages_ciphertext = ciphertext;
        entry.storages_encrypted = true;
        entry.storages = [];
    } catch (err) {
        log.error({error: err, name: "applyStorageEncryption"}, "Storage encryption failed; sending plaintext");
    }
}
