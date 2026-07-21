import {env} from "@/env.mjs";
import {escapeRegExp} from "@/utils/text";

export function getBackupFolderName() {
    const separator = "/";
    return (
        env.BACKUP_FOLDER_NAME
            ?.trim()
            .split(separator)
            .filter(Boolean)
            .join(separator) || "backups"
    );
}

export const backupFolderName = escapeRegExp(getBackupFolderName());
