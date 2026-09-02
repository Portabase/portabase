import {z} from "zod";

const isHttpProxyUrl = (value: string) => {
    if (!value) return true;

    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

export const ProxySettingsSchema = z.object({
    httpProxy: z.string().trim().max(2048).refine(isHttpProxyUrl, {
        message: "Enter a valid HTTP or HTTPS proxy URL",
    }),
});

export type ProxySettingsType = z.infer<typeof ProxySettingsSchema>;
