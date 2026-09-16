import {z} from "zod";
import {
    findBlockedBackend,
    parseRemoteNames,
} from "@/features/channel/components/storages/rclone/rclone.parse";

export const RcloneChannelConfigSchema = z
    .object({
        configText: z.string().trim().min(1, "rclone config is required"),
        remoteName: z.string().trim().min(1, "Remote name is required"),
        remotePath: z.string().trim().optional().default(""),
    })
    .superRefine((value, ctx) => {
        const remotes = parseRemoteNames(value.configText);

        if (remotes.length !== 1) {
            ctx.addIssue({
                code: "custom",
                path: ["configText"],
                message:
                    remotes.length === 0
                        ? "No remote found. The config must contain exactly one [section] header."
                        : `Paste exactly one [section]. Found ${remotes.length}: ${remotes.join(", ")}.`,
            });
            return;
        }

        const blocked = findBlockedBackend(value.configText);
        if (blocked) {
            ctx.addIssue({
                code: "custom",
                path: ["configText"],
                message:
                    `Backend type "${blocked.type}" is not allowed (remote "${blocked.remote}"). ` +
                    "Wrapping backends such as crypt, chunker and union need a second remote, " +
                    "and a channel holds only one section; memory, http and googlephotos cannot " +
                    "store a backup.",
            });
        }

        if (value.remoteName && value.remoteName !== remotes[0]) {
            ctx.addIssue({
                code: "custom",
                path: ["configText"],
                message: `Remote "${value.remoteName}" does not match the pasted section "${remotes[0]}".`,
            });
        }
    });
