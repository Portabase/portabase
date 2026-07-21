import {env} from "@/env.mjs";
import {escapeRegExp} from "@/utils/text";

export function getBackupFolderName() {
    const rawFolderName = env.BACKUP_FOLDER_NAME?.trim();

    if (!rawFolderName) {
        return "backups";
    }

    const normalizedFolderName = rawFolderName.replaceAll("\\", "/");

    const isAbsolutePath =
        normalizedFolderName.startsWith("/") ||
        /^[A-Za-z]:\//.test(normalizedFolderName);

    const segments = normalizedFolderName.split("/").filter(Boolean);
    const containsTraversal = segments.some(
        (segment) => segment === "." || segment === "..",
    );

    if (
        isAbsolutePath ||
        containsTraversal ||
        normalizedFolderName.includes("\0")
    ) {
        throw new Error(
            "BACKUP_FOLDER_NAME must be a confined relative folder path without '.' or '..' segments.",
        );
    }

    return segments.join("/");
}

export const backupFolderName = escapeRegExp(getBackupFolderName());
