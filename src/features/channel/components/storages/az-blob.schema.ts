import {z} from "zod";

export const BlobChannelConfigSchema = z.object({
    authMode: z.enum(["connectionString", "accountKey"]).default("connectionString"),
    accountName: z.string().optional(),
    accountKey: z.string().optional(),
    connectionString: z.string().optional(),
    containerName: z.string().min(1, "Container name is required"),
    endpointUrl: z.preprocess(
        (v) => (v === "" ? undefined : v),
        z.string().url("Endpoint URL must be a valid URL").optional(),
    ),
}).superRefine((data, ctx) => {
    if (data.authMode === "connectionString") {
        if (!data.connectionString) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["connectionString"],
                message: "Connection string is required",
            });
        }
    } else {
        if (!data.accountName) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["accountName"],
                message: "Account name is required",
            });
        }
        if (!data.accountKey) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["accountKey"],
                message: "Account key is required",
            });
        }
    }
});
