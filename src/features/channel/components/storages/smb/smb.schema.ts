import {z} from "zod";

export const SmbChannelConfigSchema = z.object({
    host: z.string().trim().min(1, "Host is required"),
    port: z.preprocess(
        (value) => value === "" || value === null ? undefined : value,
        z.coerce.number().int().min(1).max(65535).optional(),
    ),
    share: z.string().trim().min(1, "Share is required").refine(
        (value) => !/[\\/\r\n]/.test(value),
        "Share must not contain slashes or line breaks.",
    ),
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    remotePath: z.string().trim().optional().default(""),
}).superRefine((value, ctx) => {
    for (const field of ["host", "username"] as const) {
        if (/[\r\n]/.test(value[field])) {
            ctx.addIssue({code: "custom", path: [field], message: "Must not contain line breaks."});
        }
    }
});
