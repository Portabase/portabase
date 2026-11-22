import {z} from "zod";

const HEADER_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

const optionalText = z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().optional(),
);

export const WebDavChannelConfigSchema = z
    .object({
        url: z.string().trim().url("Must be a valid URL").refine((value) => {
            const protocol = new URL(value).protocol;
            return protocol === "http:" || protocol === "https:";
        }, "WebDAV URL must use HTTP or HTTPS"),
        username: optionalText,
        password: optionalText,
        bearerToken: optionalText,
        remotePath: z.string().trim().optional().default(""),
        headers: z.array(z.object({
            key: z.string().trim().min(1, "Header name is required").regex(HEADER_NAME, "Invalid header name"),
            value: z.string().refine((value) => !/[\r\n]/.test(value), "Header value must not contain line breaks"),
        })).max(32, "At most 32 custom headers").optional().default([]),
    })
    .superRefine((value, ctx) => {
        const hasBasic = Boolean(value.username?.trim() || value.password);
        const hasBearer = Boolean(value.bearerToken?.trim());
        if (hasBasic && hasBearer) {
            ctx.addIssue({
                code: "custom",
                path: ["bearerToken"],
                message: "Bearer token cannot be combined with username or password",
            });
        }
    });

export type WebDavChannelConfig = z.infer<typeof WebDavChannelConfigSchema>;
