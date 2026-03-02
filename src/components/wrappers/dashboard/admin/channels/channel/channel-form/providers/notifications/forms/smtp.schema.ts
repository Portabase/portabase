import {z} from "zod";

export const SmtpChannelConfigSchema = z.object({
    host: z.string().min(1, "Host is required"),
    port: z.coerce.number().min(1, "Port is required"),
    user: z.string().min(1, "User is required"),
    password: z.string().min(1, "Password is required"),
    from: z.string().min(1, "From is required"),
    to: z.string().min(1, "To is required"),
});
