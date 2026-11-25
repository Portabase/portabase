import {z} from "zod";

export const FtpChannelConfigSchema = z.object({
    host: z.string().trim().min(1, "Host is required").refine((value) => !/[\r\n]/.test(value), "Must not contain line breaks."),
    port: z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().int().min(1).max(65535).optional()),
    username: z.string().trim().min(1, "Username is required").refine((value) => !/[\r\n]/.test(value), "Must not contain line breaks."),
    password: z.string().min(1, "Password is required"),
    remotePath: z.string().trim().optional().default(""),
    ftpsMode: z.enum(["none", "explicit", "implicit"]).optional().default("none"),
});
