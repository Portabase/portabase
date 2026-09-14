import {z} from "zod";

export const SftpChannelConfigSchema = z
    .object({
        host: z.string().trim().min(1, "Host is required"),
        port: z.coerce.number().int().min(1).max(65535).optional(),
        username: z.string().trim().min(1, "Username is required"),
        password: z.string().optional(),
        privateKey: z.string().optional(),
        remotePath: z.string().trim().optional().default(""),
    })
    .superRefine((value, ctx) => {
        const hasPassword = !!value.password && value.password.trim().length > 0;
        const hasKey = !!value.privateKey && value.privateKey.trim().length > 0;
        if (!hasPassword && !hasKey) {
            ctx.addIssue({
                code: "custom",
                path: ["password"],
                message: "Provide a password or a private key.",
            });
        }
        for (const field of ["host", "username"] as const) {
            const v = value[field];
            if (typeof v === "string" && /[\r\n]/.test(v)) {
                ctx.addIssue({code: "custom", path: [field], message: "Must not contain line breaks."});
            }
        }
    });
