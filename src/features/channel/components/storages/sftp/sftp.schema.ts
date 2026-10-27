import {z} from "zod";

const KEY_ALGO = /^(ssh|ecdsa|sk)-[A-Za-z0-9@.-]+$/;
const KEY_DATA = /^[A-Za-z0-9+/]+={0,2}$/;

const hostKeys = z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().optional().transform((text, ctx) => {
        if (text === undefined) return undefined;
        const entries: string[] = [];
        for (const line of text.split(/[\r\n,]+/)) {
            const tokens = line.trim().split(/\s+/);
            if (!tokens[0] || tokens[0].startsWith("#")) continue;
            const i = tokens.findIndex((t, j) => KEY_ALGO.test(t) && KEY_DATA.test(tokens[j + 1] ?? ""));
            if (i < 0 || tokens[0].startsWith("@")) {
                ctx.addIssue({code: "custom", message: "Paste full public keys (ssh-keyscan output), not fingerprints."});
                return z.NEVER;
            }
            entries.push(`${tokens[i]} ${tokens[i + 1]}`);
        }
        if (entries.length === 0 && text.trim()) {
            ctx.addIssue({code: "custom", message: "No host key found."});
            return z.NEVER;
        }
        if (entries.length > 16) {
            ctx.addIssue({code: "custom", message: "At most 16 host keys."});
            return z.NEVER;
        }
        return entries.length ? entries.join(",") : undefined;
    }),
);

export const SftpChannelConfigSchema = z
    .object({
        host: z.string().trim().min(1, "Host is required"),
        port: z.coerce.number().int().min(1).max(65535).optional(),
        username: z.string().trim().min(1, "Username is required"),
        password: z.string().optional(),
        privateKey: z.string().optional(),
        remotePath: z.string().trim().optional().default(""),
        connections: z.preprocess(
            (v) => (v === "" || v === null ? undefined : v),
            z.coerce.number().int().min(1).optional(),
        ),
        hostKeys,
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
