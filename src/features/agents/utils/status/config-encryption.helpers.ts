import { logger } from "@/lib/logger";
import { encryptJsonGcm, isAgentVersionAtLeast, MIN_AGENT_VERSION_DB_CONFIG } from "@/utils/status-crypto";

const log = logger.child({ module: "api/agent/status/config-encryption" });

/**
 * Encrypt the per-database `config` for transit. config always carries
 * secrets, so:
 *  - no master key or agent below the version gate  -> config removed entirely
 *  - otherwise -> config_ciphertext + config_encrypted, plaintext cleared
 */
export function applyConfigEncryption(
  entry: Record<string, any>,
  version: string | undefined,
  masterKey: Buffer | null,
  agentId: string,
): void {
  if (entry.config == null) return;

  if (!masterKey || !isAgentVersionAtLeast(version, MIN_AGENT_VERSION_DB_CONFIG)) {
    if (!masterKey) {
      log.error({ name: "applyConfigEncryption", agentId }, "Master key unavailable; config withheld");
    }
    delete entry.config;
    return;
  }

  try {
    entry.config_ciphertext = encryptJsonGcm(entry.config, masterKey);
    entry.config_encrypted = true;
    delete entry.config;
  } catch (err) {
    log.error({ error: err, name: "applyConfigEncryption", agentId }, "Config encryption failed; config withheld");
    delete entry.config;
  }
}
